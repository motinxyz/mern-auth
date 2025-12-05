import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * Custom error for asynchronous errors occurring within a BullMQ Queue instance.
 * This typically indicates a problem with the underlying connection (e.g., Redis)
 * and is treated as a critical infrastructure failure.
 */
class QueueError extends ApiError {
  constructor(originalError) {
    const message =
      typeof originalError === "string"
        ? originalError
        : originalError?.message || "Queue error occurred";

    super(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, message);
    this.name = "QueueError";
    this.originalError =
      typeof originalError === "object" ? originalError : null;
  }
}

export default QueueError;
