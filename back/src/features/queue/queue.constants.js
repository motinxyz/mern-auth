/**
 * Centralized constants for queue management.
 * This prevents the use of "magic strings" for queue names and job types,
 * reducing the risk of typos and making the system easier to maintain.
 */

export const QUEUE_NAMES = Object.freeze({
  EMAIL: "emailQueue",
});

export const EMAIL_JOB_TYPES = Object.freeze({
  SEND_VERIFICATION_EMAIL: "sendVerificationEmail",
  // e.g., SEND_PASSWORD_RESET: "sendPasswordReset",
});