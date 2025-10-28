/**
 * Centralized constants for token management.
 */

export const REDIS_KEY_PREFIXES = Object.freeze({
  VERIFY_EMAIL: "verify:",
  // e.g., PASSWORD_RESET: "reset:",
});

export const HASHING_ALGORITHM = "sha256";