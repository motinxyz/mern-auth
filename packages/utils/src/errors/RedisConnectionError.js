/**
 * Custom error for failures related to the Redis connection.
 * This helps distinguish infrastructure issues from other application errors.
 */
export default class RedisConnectionError extends Error {
  constructor(originalError) {
    // The message for this error should be the message from the underlying ioredis error.
    // We provide a fallback message for safety.
    super(originalError?.message || "A critical Redis connection error occurred.");
    this.name = "RedisConnectionError";
    this.originalError = originalError; // The underlying error from ioredis
  }
}
