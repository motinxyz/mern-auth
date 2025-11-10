import { describe, it, expect, vi, beforeEach } from "vitest";
import Redis from "ioredis-mock";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { redisConnection } from "@auth/queues";
import { config, TOKEN_REDIS_PREFIXES } from "@auth/config";
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

// Use a high-fidelity mock for Redis
vi.mock("@auth/queues", () => ({
  redisConnection: new Redis(),
}));

vi.mock("@auth/config", () => {
  return {
    config: {
      verificationTokenExpiresIn: 3600,
    },
    logger: {
      child: vi.fn(() => ({
        debug: (...args) => mockDebug(...args),
        info: (...args) => mockInfo(...args),
        error: (...args) => mockError(...args),
      })),
    },
    TOKEN_REDIS_PREFIXES: {
      VERIFY_EMAIL: "verify-email:",
    },
    t: vi.fn((key) => key),
  };
});

describe("Token Service", () => {
  beforeEach(() => {
    mockDebug = vi.fn();
    mockInfo = vi.fn();
    mockError = vi.fn();
    vi.clearAllMocks();
    redisConnection.flushall();
  });

  describe("createVerificationToken", () => {
    it("should create a token, hash it, and store it in Redis", async () => {
      const user = { id: "userId123", email: "test@example.com" };
      const token = "72616e646f6d5f746f6b656e5f737472696e67";
      const hashedToken = "hashed_token_string";

      vi.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from(token, "hex"));
      vi.spyOn(crypto, "createHash").mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(hashedToken),
      });

      const result = await createVerificationToken(user);

      expect(result).toBe(token);

      const storedValue = await redisConnection.get(
        `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`
      );
      expect(storedValue).not.toBeNull();
      expect(JSON.parse(storedValue)).toEqual({
        userId: user.id,
        email: user.email,
      });

      const ttl = await redisConnection.ttl(
        `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`
      );
      expect(ttl).toBe(config.verificationTokenExpiresIn);

      expect(mockDebug).toHaveBeenCalledWith(
        {
          key: `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`,
          ttl: expect.any(Number),
          redisResponse: "OK",
        },
        "token:stored"
      );
    });

    it("should throw TokenCreationError if redis fails", async () => {
      const user = { id: "userId123", email: "test@example.com" };
      const errorMessage = "Redis connection failed";

      vi.spyOn(redisConnection, "set").mockRejectedValue(new Error(errorMessage));

      await expect(createVerificationToken(user)).rejects.toThrow(
        TokenCreationError
      );

      expect(mockError).toHaveBeenCalledWith(
        { err: new Error(errorMessage) },
        "token:creationFailed"
      );
    });
  });
});
