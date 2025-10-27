/**
 * Custom error for asynchronous errors occurring within a BullMQ Queue instance.
 * This typically indicates a problem with the underlying connection (e.g., Redis)
 * and is treated as a critical infrastructure failure.
 */
export default class QueueError extends Error {
  constructor(originalError) {
    super(originalError?.message);
    this.name = "QueueError";
    this.originalError = originalError;
  }
}