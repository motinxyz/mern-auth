/**
 * Centralized constants for queue management.
 * This prevents the use of "magic strings" for queue names and job types,
 * reducing the risk of typos and making the system easier to maintain.
 */

export const QUEUE_NAMES = Object.freeze({
  EMAIL: "emailQueue",
  EMAIL_DEAD_LETTER: "emailDeadLetter",
});

export const EMAIL_JOB_TYPES = Object.freeze({
  SEND_VERIFICATION_EMAIL: "sendVerificationEmail",
  // e.g., SEND_PASSWORD_RESET: "sendPasswordReset",
});

export const WORKER_CONFIG = Object.freeze({
  CONCURRENCY: 5,
  JOB_RETENTION: {
    REMOVE_ON_COMPLETE_COUNT: 1000,
    REMOVE_ON_FAIL_COUNT: 5000,
  },
  RATE_LIMIT: {
    MAX_JOBS: 100,
    DURATION: 1000 * 60, // 1 minute in milliseconds
  },
});
