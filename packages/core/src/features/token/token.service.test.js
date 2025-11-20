import { describe, it, expect, vi, beforeEach } from "vitest";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { TOKEN_REDIS_PREFIXES } from "@auth/config";
import { createVerificationToken } from "./token.service.js";
import { TokenCreationError, ApiError } from "@auth/utils";

// Mock dependencies
let mockDebug = vi.fn();
let mockInfo = vi.fn();
let mockError = vi.fn();

vi.mock("node:crypto", async () => {
  const actualCrypto = await vi.importActual("node:crypto");
  return {
    ...actualCrypto,
    randomBytes: vi.fn(() => Buffer.from("random_token_string")),
    createHash: vi.fn(() => ({
      update: vi.fn(() => ({
        digest: vi.fn(() => "hashed_token_string"),
      })),
    })),
  };
});

vi.mock("@auth/utils", async () => ({
  ...(await vi.importActual("@auth/utils")),
  HASHING_ALGORITHM: "sha256",
  TokenCreationError: class TokenCreationError extends Error {
    constructor(message, originalError) {
      super(message);
      this.name = "TokenCreationError";
      this.originalError = originalError;
    }
  },
}));

vi.mock('@auth/config', () => {
  // Create Redis mock that stores data
  const mockRedisData = new Map();
  const mockRedisInstance = {
    data: mockRedisData,
    set: vi.fn().mockImplementation(async (key, value, ...args) => {
      mockRedisData.set(key, value);
      // Extract TTL if provided (EX, 300 format)
      const exIndex = args.indexOf('EX');
      if (exIndex !== -1) {
        // Store TTL info if needed
      }
      return 'OK';
    }),
    get: vi.fn().mockImplementation(async (key) => {
      return mockRedisData.get(key) || null;
    }),
    ttl: vi.fn().mockResolvedValue(300),
    flushall: vi.fn().mockImplementation(async () => {
      mockRedisData.clear();
      return 'OK';
    }),
  };

  return {
    redisConnection: mockRedisInstance,
    logger: {
      child: vi.fn(() => ({
        debug: (...args) => mockDebug(...args),
        info: (...args) => mockInfo(...args),
        error: (...args) => mockError(...args),
        fatal: vi.fn(),
      })),
    },
    t: vi.fn((key) => key),
    config: {
      verificationTokenExpiresIn: 300,
      redis: {
        prefixes: {
          verifyEmail: 'verify-email:',
        },
      },
    },
  };
});

describe("Token Service", () => {
  let redisConnection;
  let configModule;

  beforeEach(async () => {
    configModule = await vi.importMock('@auth/config');
    redisConnection = configModule.redisConnection;
    mockDebug = vi.fn();
    mockInfo = vi.fn();
    mockError = vi.fn();
    vi.clearAllMocks();
    // Clear Redis data
    await redisConnection.flushall();
  });

  describe("createVerificationToken", () => {
    it("should create a token, hash it, and store it in Redis", async () => {
      const user = { id: "userId123", email: "test@example.com" };
      const token = "72616e646f5f746f6b656e5f737472696e67";
      const hashedToken = "hashed_token_string";

      vi.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from(token, "hex"));
      vi.spyOn(crypto, "createHash").mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(hashedToken),
      });

      const result = await createVerificationToken(user);

      expect(result).toBe(token);

      const storedValue = await redisConnection.get(
        `${configModule.config.redis.prefixes.verifyEmail}${hashedToken}`
      );
      expect(storedValue).not.toBeNull();
      expect(JSON.parse(storedValue)).toEqual({
        userId: user.id,
        email: user.email,
      });

      const ttl = await redisConnection.ttl(
        `${configModule.config.redis.prefixes.verifyEmail}${hashedToken}`
      );
      expect(Math.abs(ttl - configModule.config.verificationTokenExpiresIn)).toBeLessThanOrEqual(1);

      expect(mockDebug).toHaveBeenCalledWith(
        {
          key: `${configModule.config.redis.prefixes.verifyEmail}${hashedToken}`,
          ttl: expect.any(Number),
          redisResponse: "OK",
        },
        "token:stored"
      );
    });

    it("should throw TokenCreationError if redis fails", async () => {
      const user = { id: "userId123", email: "test@example.com" };
      const errorMessage = "Redis connection failed";

      // Make set reject
      redisConnection.set = vi.fn().mockRejectedValue(new Error(errorMessage));

      await expect(createVerificationToken(user)).rejects.toThrow(
        TokenCreationError
      );

      expect(mockError).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "token:creationFailed"
      );
    });
  });
});
