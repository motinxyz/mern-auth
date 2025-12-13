/**
 * Centralized constants for the authentication feature.
 * Uses `as const` for proper type inference.
 */
export const VERIFICATION_STATUS = {
  VERIFIED: "VERIFIED",
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
} as const;

export const RATE_LIMIT_DURATIONS = {
  VERIFY_EMAIL: 180, // 3 minutes in seconds
} as const;

export const REDIS_RATE_LIMIT_VALUE = "1" as const;

// Type exports
export type VerificationStatusType = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];
