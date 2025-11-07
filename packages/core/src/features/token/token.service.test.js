import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Redis from 'ioredis-mock';
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { redisConnection } from "@auth/queues";
import { config, TOKEN_REDIS_PREFIXES } from "@auth/config";
import { createVerificationToken } from "./token.service.js";
import { config, TOKEN_REDIS_PREFIXES, mockDebug } from "@auth/config";
import { config, TOKEN_REDIS_PREFIXES, mockDebug } from "@auth/config";

// Mock dependencies
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
}));

// Use a high-fidelity mock for Redis
vi.mock("@auth/queues", () => ({
  redisConnection: new Redis(),
}));

export const mockDebug = vi.fn();
export const mockInfo = vi.fn();
export const mockError = vi.fn();

vi.mock("@auth/config", () => ({
  config: {
    verificationTokenExpiresIn: 3600,
  },
  logger: {
    child: vi.fn(() => ({
      debug: mockDebug,
      info: mockInfo,
      error: mockError,
    })),
  },
  TOKEN_REDIS_PREFIXES: {
    VERIFY_EMAIL: "verify-email:",
  },
  t: vi.fn((key) => key),
}));

vi.mock("@auth/config", () => {
  const mockDebug = vi.fn();
  const mockInfo = vi.fn();
  const mockError = vi.fn();

  return {
    config: {
      verificationTokenExpiresIn: 3600,
    },
    logger: {
      child: vi.fn(() => ({
        debug: mockDebug,
        info: mockInfo,
        error: mockError,
      })),
    },
    TOKEN_REDIS_PREFIXES: {
      VERIFY_EMAIL: "verify-email:",
    },
    t: vi.fn((key) => key),
    // Export the mock functions so they can be imported and asserted against
    mockDebug,
    mockInfo,
    mockError,
  };
});



describe("Token Service", () => {
  beforeEach(() => {
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
        { key: `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`, ttl: expect.any(Number), redisResponse: "OK" },
        "token:stored"
      );
    });
  });
});
