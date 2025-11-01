import { AUTH_REDIS_PREFIXES as redisPrefixes } from "../../config/redis.js";

/**
 * Centralized constants for the authentication feature.
 */
export const VERIFICATION_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
});

export const AUTH_REDIS_PREFIXES = Object.freeze({
  VERIFY_EMAIL_RATE_LIMIT: redisPrefixes.VERIFY_EMAIL_RATE_LIMIT,
});

export const RATE_LIMIT_DURATIONS = Object.freeze({
  VERIFY_EMAIL: 180, // 3 minutes in seconds
});
