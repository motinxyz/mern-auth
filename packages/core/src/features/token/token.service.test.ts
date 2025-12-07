import { describe, it, expect, vi, beforeEach } from "vitest";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { TokenService } from "./token.service.js";
import { TokenCreationError } from "@auth/utils";

// Mock dependencies
let mockDebug;
let mockInfo;
let mockError;

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

describe("Token Service", () => {
  let tokenService;
  let mockRedis;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    // Reset mocks
    mockDebug = vi.fn();
    mockInfo = vi.fn();
    mockError = vi.fn();
    vi.clearAllMocks();

    // Create mock Redis
    const mockRedisData = new Map();
    mockRedis = {
      data: mockRedisData,
      set: vi.fn().mockImplementation(async (key, value) => {
        mockRedisData.set(key, value);
        return "OK";
      }),
      get: vi.fn().mockImplementation(async (key) => {
        return mockRedisData.get(key) || null;
      }),
      ttl: vi.fn().mockResolvedValue(300),
      flushall: vi.fn().mockImplementation(async () => {
        mockRedisData.clear();
        return "OK";
      }),
    };

    // Create mock config
    mockConfig = {
      verificationTokenExpiresIn: 300,
      redis: {
        prefixes: {
          verifyEmail: "verify-email:",
        },
      },
    };

    // Create mock logger
    mockLogger = {
      child: vi.fn(() => ({
        debug: (...args) => mockDebug(...args),
        info: (...args) => mockInfo(...args),
        error: (...args) => mockError(...args),
        fatal: vi.fn(),
      })),
    };

    // Instantiate TokenService with mocked dependencies
    tokenService = new TokenService({
      redis: mockRedis,
      config: mockConfig,
      logger: mockLogger,
    });
  });

  describe("createVerificationToken", () => {
    it("should create a token, hash it, and store it in Redis", async () => {
      const user = {
        id: "userId123",
        _id: "userId123",
        email: "test@example.com",
      };
      const token = "72616e646f5f746f6b656e5f737472696e67";
      const hashedToken = "hashed_token_string";

      vi.spyOn(crypto, "randomBytes").mockReturnValue(
        Buffer.from(token, "hex")
      );
      vi.spyOn(crypto, "createHash").mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(hashedToken),
      });

      const result = await tokenService.createVerificationToken(user);

      expect(result).toBe(token);

      const storedValue = await mockRedis.get(
        `${mockConfig.redis.prefixes.verifyEmail}${hashedToken}`
      );
      expect(storedValue).not.toBeNull();
      expect(JSON.parse(storedValue)).toEqual({
        userId: user.id,
        email: user.email,
      });

      const ttl = await mockRedis.ttl(
        `${mockConfig.redis.prefixes.verifyEmail}${hashedToken}`
      );
      expect(
        Math.abs(ttl - mockConfig.verificationTokenExpiresIn)
      ).toBeLessThanOrEqual(1);

      expect(mockDebug).toHaveBeenCalledWith(
        {
          key: `${mockConfig.redis.prefixes.verifyEmail}${hashedToken}`,
          ttl: expect.any(Number),
          redisResponse: "OK",
        },
        "Token stored in Redis"
      );
    });

    it("should throw TokenCreationError if redis fails", async () => {
      const user = {
        id: "userId123",
        _id: "userId123",
        email: "test@example.com",
      };
      const errorMessage = "Redis connection failed";

      // Make set reject
      mockRedis.set = vi.fn().mockRejectedValue(new Error(errorMessage));

      await expect(tokenService.createVerificationToken(user)).rejects.toThrow(
        TokenCreationError
      );

      expect(mockError).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Token creation failed"
      );
    });
  });
});
