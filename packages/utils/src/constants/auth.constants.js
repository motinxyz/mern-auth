import { AUTH_REDIS_PREFIXES } from "@auth/config/env";

/**
 * Centralized constants for the authentication feature.
 */
export const VERIFICATION_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
});

export { AUTH_REDIS_PREFIXES };

export const RATE_LIMIT_DURATIONS = Object.freeze({
  VERIFY_EMAIL: 180, // 3 minutes in seconds
});
