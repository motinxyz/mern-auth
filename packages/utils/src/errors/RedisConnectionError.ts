/**
 * Custom error for failures related to the Redis connection.
 */
export default class RedisConnectionError extends Error {
  public readonly originalError: Error | null;

  constructor(originalError: Error | null = null) {
    super(originalError?.message ?? "A critical Redis connection error occurred.");
    this.name = "RedisConnectionError";
    this.originalError = originalError;
  }
}
