/**
 * Custom error for failures that occur during token creation or storage.
 * This helps distinguish token-related failures (e.g., Redis errors)
 * from other application errors.
 */
export default class TokenCreationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "TokenCreationError";
    this.originalError = originalError; // The underlying error from crypto or ioredis
  }
}