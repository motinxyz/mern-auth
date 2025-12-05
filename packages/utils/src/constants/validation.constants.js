/**
 * Validation rules and constants
 */
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 4,
  },
  PASSWORD: {
    MIN_LENGTH: 4,
  },
  /**
   * Stricter email regex that prevents:
   * - Consecutive dots (..)
   * - Leading or trailing dots
   * - Special characters at start/end of local part
   * - Invalid domain formats
   *
   * Valid: user@example.com, user.name@example.com, user+tag@example.co.uk
   * Invalid: user..name@example.com, .user@example.com, user.@example.com
   */
  EMAIL_REGEX: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
};
