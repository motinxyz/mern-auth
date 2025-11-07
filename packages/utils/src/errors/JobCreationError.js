/**
 * Custom error for failures that occur while trying to add a job to the BullMQ queue.
 * This helps distinguish queueing failures from other application or API errors.
 */
export default class JobCreationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "JobCreationError";
    this.originalError = originalError; // The underlying error from BullMQ/ioredis
  }
}
