/**
 * Application-wide queue names
 * Centralized to prevent typos and ensure consistency
 */
export const QUEUE_NAMES = Object.freeze({
  EMAIL: "emailQueue",
  EMAIL_DEAD_LETTER: "emailDeadLetter",
  // Add more queue names as needed:
  // SMS: "smsQueue",
  // NOTIFICATIONS: "notificationsQueue",
});

/**
 * Email job types
 */
export const EMAIL_JOB_TYPES = Object.freeze({
  SEND_VERIFICATION_EMAIL: "sendVerificationEmail",
  // Add more email job types:
  // SEND_PASSWORD_RESET: "sendPasswordReset",
  // SEND_WELCOME_EMAIL: "sendWelcomeEmail",
});

/**
 * Default settings for queue workers
 */
export const WORKER_CONFIG = Object.freeze({
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
  settings: {
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2,
    lockDuration: 60000, // Lock jobs for 60 seconds
    drainDelay: 500, // Wait 500ms before draining
  },
  retention: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
