
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Redis from 'ioredis-mock';
import { User, default as mongoose } from '@auth/database';
import { redisConnection } from '@auth/queues';
import { addEmailJob } from '@auth/queues/producers';
import { createVerificationToken } from '../token/token.service.js';
import { registerNewUser, verifyUserEmail } from './auth.service.js';
import { TooManyRequestsError, NotFoundError, VERIFICATION_STATUS } from '@auth/utils';
import crypto from 'node:crypto';

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
    },
  };
});

// Use a high-fidelity mock for Redis
vi.mock('@auth/queues', () => ({
  redisConnection: new Redis(),
}));

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

vi.mock('@auth/config', () => ({
  config: {
    bcryptSaltRounds: 10,
  },
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    })),
  },
  t: vi.fn((key) => key),
  TOKEN_REDIS_PREFIXES: {
    VERIFY_EMAIL: 'verify-email:',
  },
  AUTH_REDIS_PREFIXES: {
    VERIFY_EMAIL_RATE_LIMIT: 'rate-limit:verify-email:',
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all data from the mock redis instance before each test
    redisConnection.flushall();
  });

  describe('registerNewUser', () => {
    it('should register a new user and orchestrate verification', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password' };
      const req = { t: vi.fn((key) => key), locale: 'en' };
      const newUser = { ...userData, id: '123', toJSON: () => ({ ...userData, id: '123' }) };
      const session = await mongoose.startSession();
      session.withTransaction.mockImplementation(async (fn) => fn(session));

      User.create.mockResolvedValue([newUser]);
      createVerificationToken.mockResolvedValue('test_token');

      const result = await registerNewUser(userData, req);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalledWith([userData], { session });
      expect(createVerificationToken).toHaveBeenCalledWith(newUser);
      expect(addEmailJob).toHaveBeenCalled();
      expect(await redisConnection.get('rate-limit:verify-email:test@example.com')).not.toBeNull();
      expect(result).toEqual({ ...userData, id: '123' });
    }, 30000);

    it('should throw TooManyRequestsError if rate limit is exceeded', async () => {
      const userData = { email: 'test@example.com' };
      // Set the rate limit key in the mock redis
      await redisConnection.set('rate-limit:verify-email:test@example.com', 'true');

      await expect(registerNewUser(userData, {})).rejects.toThrow(TooManyRequestsError);
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify a user with a valid token', async () => {
        const token = 'valid_token';
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userData = { userId: '123' };
        const user = { id: '123', isVerified: false, save: vi.fn() };

        // Set the verification key in the mock redis
        await redisConnection.set(`verify-email:${hashedToken}`, JSON.stringify(userData));
        User.findById.mockResolvedValue(user);

        const result = await verifyUserEmail(token);

        expect(User.findById).toHaveBeenCalledWith('123');
        expect(user.isVerified).toBe(true);
        expect(user.save).toHaveBeenCalled();
        // Check that the key was deleted
        expect(await redisConnection.get(`verify-email:${hashedToken}`)).toBeNull();
        expect(result).toEqual({ status: VERIFICATION_STATUS.VERIFIED });
    });

    it('should return ALREADY_VERIFIED if user is already verified', async () => {
        const token = 'valid_token';
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userData = { userId: '123' };
        const user = { id: '123', isVerified: true };

        await redisConnection.set(`verify-email:${hashedToken}`, JSON.stringify(userData));
        User.findById.mockResolvedValue(user);

        const result = await verifyUserEmail(token);

        expect(await redisConnection.get(`verify-email:${hashedToken}`)).toBeNull();
        expect(result).toEqual({ status: VERIFICATION_STATUS.ALREADY_VERIFIED });
    });

    it('should throw NotFoundError for an invalid token', async () => {
        const token = 'invalid_token';
        await expect(verifyUserEmail(token)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user is not found', async () => {
        const token = 'valid_token';
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userData = { userId: '123' };

        await redisConnection.set(`verify-email:${hashedToken}`, JSON.stringify(userData));
        User.findById.mockResolvedValue(null);

        await expect(verifyUserEmail(token)).rejects.toThrow(NotFoundError);
    });
  });
});
