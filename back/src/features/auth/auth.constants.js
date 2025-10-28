/**
 * Centralized constants for the authentication feature.
 */

export const REDIS_KEY_PREFIXES = Object.freeze({
  VERIFY_EMAIL_RATE_LIMIT: "verify-email-rate-limit:",
});

export const RATE_LIMIT_DURATIONS = Object.freeze({
  VERIFY_EMAIL: 180, // 3 minutes in seconds
});

export const VERIFICATION_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
});