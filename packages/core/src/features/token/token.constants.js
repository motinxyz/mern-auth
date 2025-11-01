import { TOKEN_REDIS_PREFIXES as redisPrefixes } from "../../config/redis.js";

/**
 * Centralized constants for token management.
 */

export const TOKEN_REDIS_PREFIXES = Object.freeze({
  VERIFY_EMAIL: redisPrefixes.VERIFY_EMAIL,
  // e.g., PASSWORD_RESET: "reset:",
});

export const HASHING_ALGORITHM = "sha256";
