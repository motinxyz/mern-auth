import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { User, default as mongoose } from '@auth/database';
import { addEmailJob } from '@auth/queues/producers';
import { AuthService } from './auth.service.js';
import { TokenService } from '../token/token.service.js'; // Import actual TokenService for registration
import { TooManyRequestsError, NotFoundError, VERIFICATION_STATUS } from '@auth/utils';
import crypto from 'node:crypto';
import { createContainer, asClass, asValue } from 'awilix';

// Mock dependencies that AuthService directly uses or instantiates
vi.mock('mongoose', async () => {
  const actualMongoose = await vi.importActual('mongoose');
  const session = {
    withTransaction: vi.fn().mockImplementation(async (fn) => fn(session)),
    endSession: vi.fn(),
  };
  return {
    ...actualMongoose,
    default: {
      ...actualMongoose.default,
      startSession: vi.fn().mockResolvedValue(session),
      connection: new actualMongoose.default.EventEmitter(),
    },
  };
});

vi.mock('@auth/database', async (importOriginal) => {
  const actual = await importOriginal();
  actual.User.create = vi.fn();
  actual.User.findById = vi.fn();
  actual.default.startSession = vi.fn().mockResolvedValue({
    withTransaction: vi.fn().mockImplementation(async (fn) => fn()),
    endSession: vi.fn(),
  });
  return actual;
});

vi.mock('@auth/queues/producers', () => ({
  addEmailJob: vi.fn().mockResolvedValue({}),
}));

// Mock crypto for consistent hashing in tests
vi.mock('node:crypto', () => {
  const createHash = vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'hashed_token_string'),
    })),
  }));
  return {
    default: { createHash }, // Provide a default export
    createHash, // Also provide named export for consistency if needed elsewhere
  };
});

describe('Auth Service', () => {
  let container;
  let authService;
  let mockLogger;
  let mockRedisConnection;
  let mockT;
  let mockTokenService; // This will be the mocked instance of TokenService

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create a fresh container for each test
    container = createContainer();

    // Mock core dependencies
    mockLogger = {
      child: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    };
    mockRedisConnection = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    mockT = vi.fn((key) => key);

    // Mock TokenService
    mockTokenService = {
      createVerificationToken: vi.fn(),
    };

    // Register mocks and actual services with the container
    container.register({
      logger: asValue(mockLogger),
      redisConnection: asValue(mockRedisConnection),
      t: asValue(mockT),
      tokenService: asValue(mockTokenService), // Register the mocked instance
      authService: asClass(AuthService).singleton(),
    });

    // Resolve AuthService from the container
    authService = container.resolve('authService');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('registerNewUser', () => {
    it('should register a new user and orchestrate verification', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password' };
      const locale = 'en';
      const newUser = { ...userData, id: '123', toJSON: () => ({ ...userData, id: '123' }) };
      const session = await mongoose.startSession();
      session.withTransaction.mockImplementation(async (fn) => fn(session));

      User.create.mockResolvedValue([newUser]);
      mockTokenService.createVerificationToken.mockResolvedValue('test_token');
      mockRedisConnection.get.mockResolvedValue(null);
      mockRedisConnection.set.mockResolvedValue('OK');

      const result = await authService.registerNewUser(userData, locale);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalledWith([userData], { session });
      expect(mockTokenService.createVerificationToken).toHaveBeenCalledWith(newUser);
      expect(addEmailJob).toHaveBeenCalled();
      expect(mockRedisConnection.get).toHaveBeenCalledWith('verify-email-rate-limit:test@example.com');
      expect(mockRedisConnection.set).toHaveBeenCalledWith('verify-email-rate-limit:test@example.com', '1', 'EX', 180);
      expect(result).toEqual({ ...userData, id: '123' });
    }, 30000);

    it('should throw TooManyRequestsError if rate limit is exceeded', async () => {
      const userData = { email: 'test@example.com' };
      const locale = 'en';
      
      mockRedisConnection.get.mockResolvedValue('true');

      await expect(authService.registerNewUser(userData, locale)).rejects.toThrow(TooManyRequestsError);
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify a user with a valid token', async () => {
        const token = 'valid_token';
        const hashedToken = 'hashed_token_string'; // From mocked crypto
        const userData = { userId: '123' };
        const user = { id: '123', isVerified: false, save: vi.fn() };

        mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
        mockRedisConnection.del.mockResolvedValue(1);
        User.findById.mockResolvedValue(user);

        const result = await authService.verifyUserEmail(token);

        expect(User.findById).toHaveBeenCalledWith('123');
        expect(user.isVerified).toBe(true);
        expect(user.save).toHaveBeenCalled();
        expect(mockRedisConnection.del).toHaveBeenCalledWith(`verify:${hashedToken}`);
        expect(result).toEqual({ status: VERIFICATION_STATUS.VERIFIED });
    });

    it('should return ALREADY_VERIFIED if user is already verified', async () => {
        const token = 'valid_token';
        const hashedToken = 'hashed_token_string'; // From mocked crypto
        const userData = { userId: '123' };
        const user = { id: '123', isVerified: true };

        mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
        mockRedisConnection.del.mockResolvedValue(1);
        User.findById.mockResolvedValue(user);

        const result = await authService.verifyUserEmail(token);

        expect(mockRedisConnection.del).toHaveBeenCalledWith(`verify:${hashedToken}`);
        expect(result).toEqual({ status: VERIFICATION_STATUS.ALREADY_VERIFIED });
    });

    it('should throw NotFoundError for an invalid token', async () => {
        const token = 'invalid_token';
        mockRedisConnection.get.mockResolvedValue(null);
        await expect(authService.verifyUserEmail(token)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user is not found', async () => {
        const token = 'valid_token';
        const hashedToken = 'hashed_token_string'; // From mocked crypto
        const userData = { userId: '123' };

        mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
        User.findById.mockResolvedValue(null);

        await expect(authService.verifyUserEmail(token)).rejects.toThrow(NotFoundError);
    });
  });
});
