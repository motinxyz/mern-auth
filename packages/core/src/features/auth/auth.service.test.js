
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { User, default as mongoose } from '@auth/database';
import { addEmailJob } from '@auth/queues/producers';
import { createVerificationToken } from '../token/token.service.js';
import { registerNewUser, verifyUserEmail } from './auth.service.js';
import { TooManyRequestsError, NotFoundError, VERIFICATION_STATUS } from '@auth/utils';
import crypto from 'node:crypto';

// Mock Redis before other mocks
vi.mock('@auth/config', () => ({
  redisConnection: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  t: vi.fn((key) => key),
  AUTH_REDIS_PREFIXES: {
    VERIFY_EMAIL_RATE_LIMIT: 'rate-limit:verify-email:',
  },
  TOKEN_REDIS_PREFIXES: {
    VERIFY_EMAIL: 'verify-email:',
  },
}));

// Mock dependencies
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
      connection: new actualMongoose.default.EventEmitter(), // Use actual Mongoose EventEmitter
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

vi.mock('../token/token.service.js', () => ({
  createVerificationToken: vi.fn(),
}));

describe('Auth Service', () => {
  let mockRedisConnection;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import the mocked config to get the mock redis connection
    const configModule = await vi.importMock('@auth/config');
    mockRedisConnection = configModule.redisConnection;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('registerNewUser', () => {
    it('should register a new user and orchestrate verification', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password' };
      const req = { t: vi.fn((key) => key), locale: 'en' }; // Mock req.t here
      const newUser = { ...userData, id: '123', toJSON: () => ({ ...userData, id: '123' }) };
      const session = await mongoose.startSession();
      session.withTransaction.mockImplementation(async (fn) => fn(session));

      User.create.mockResolvedValue([newUser]);
      createVerificationToken.mockResolvedValue('test_token');
      mockRedisConnection.get.mockResolvedValue(null);
      mockRedisConnection.set.mockResolvedValue('OK');

      const result = await registerNewUser(userData, req);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalledWith([userData], { session });
      expect(createVerificationToken).toHaveBeenCalledWith(newUser);
      expect(addEmailJob).toHaveBeenCalled();
      expect(mockRedisConnection.get).toHaveBeenCalledWith('rate-limit:verify-email:test@example.com');
      expect(mockRedisConnection.set).toHaveBeenCalledWith('rate-limit:verify-email:test@example.com', '1', 'EX', 180);
      expect(result).toEqual({ ...userData, id: '123' });
    }, 30000);

    it('should throw TooManyRequestsError if rate limit is exceeded', async () => {
      const userData = { email: 'test@example.com' };
      const req = { t: vi.fn((key) => key) }; // Mock req.t here
      
      mockRedisConnection.get.mockResolvedValue('true');

      await expect(registerNewUser(userData, req)).rejects.toThrow(TooManyRequestsError);
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify a user with a valid token', async () => {
        const token = 'valid_token';
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userData = { userId: '123' };
        const user = { id: '123', isVerified: false, save: vi.fn() };

        mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
        mockRedisConnection.del.mockResolvedValue(1);
        User.findById.mockResolvedValue(user);

        const result = await verifyUserEmail(token);

        expect(User.findById).toHaveBeenCalledWith('123');
        expect(user.isVerified).toBe(true);
        expect(user.save).toHaveBeenCalled();
        expect(mockRedisConnection.del).toHaveBeenCalledWith(`verify-email:${hashedToken}`);
        expect(result).toEqual({ status: VERIFICATION_STATUS.VERIFIED });
    });

    it('should return ALREADY_VERIFIED if user is already verified', async () => {
        const token = 'valid_token';
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userData = { userId: '123' };
        const user = { id: '123', isVerified: true };

        mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
        mockRedisConnection.del.mockResolvedValue(1);
        User.findById.mockResolvedValue(user);

        const result = await verifyUserEmail(token);

        expect(mockRedisConnection.del).toHaveBeenCalledWith(`verify-email:${hashedToken}`);
        expect(result).toEqual({ status: VERIFICATION_STATUS.ALREADY_VERIFIED });
    });

    it('should throw NotFoundError for an invalid token', async () => {
        const token = 'invalid_token';
        mockRedisConnection.get.mockResolvedValue(null);
        await expect(verifyUserEmail(token)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user is not found', async () => {
        const token = 'valid_token';
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userData = { userId: '123' };

        mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
        User.findById.mockResolvedValue(null);

        await expect(verifyUserEmail(token)).rejects.toThrow(NotFoundError);
    });
  });
});
