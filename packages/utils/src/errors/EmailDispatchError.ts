/**
 * Custom error for failures that occur while dispatching an email.
 */
export default class EmailDispatchError extends Error {
  public readonly originalError: Error | null;

  constructor(message: string, originalError: Error | null = null) {
    super(message);
    this.name = "EmailDispatchError";
    this.originalError = originalError;
  }
}
