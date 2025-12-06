/**
 * Custom error for failures that occur during token creation or storage.
 */
export default class TokenCreationError extends Error {
  public readonly originalError: Error | null;

  constructor(message: string, originalError: Error | null = null) {
    super(message);
    this.name = "TokenCreationError";
    this.originalError = originalError;
  }
}
