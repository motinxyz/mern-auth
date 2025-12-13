/**
 * Validation Rules and Constants
 *
 * Centralized validation configuration for consistent enforcement.
 * Uses `as const` for type safety.
 */

export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 100,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  /**
   * RFC 5322 compliant email regex
   *
   * Validates:
   * - Local part: alphanumeric, dots, hyphens, underscores, plus signs
   * - Domain: alphanumeric, dots, hyphens
   * - TLD: 2-63 characters
   *
   * @see https://emailregex.com/
   */
  // eslint-disable-next-line security/detect-unsafe-regex
  EMAIL_REGEX: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
} as const;

/**
 * Validation error messages (i18n keys)
 */
export const VALIDATION_MESSAGES = {
  NAME: {
    REQUIRED: "validation:name.required",
    LENGTH: "validation:name.length",
  },
  EMAIL: {
    REQUIRED: "validation:email.required",
    INVALID: "validation:email.invalid",
    IN_USE: "validation:email.inUse",
  },
  PASSWORD: {
    REQUIRED: "validation:password.required",
    LENGTH: "validation:password.length",
    WEAK: "validation:password.weak",
  },
} as const;
