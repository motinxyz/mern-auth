import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * @class DatabaseConnectionError
 * @extends ApiError
 * @description Represents an error that occurs when the application fails to connect to the database after multiple retries.
 * This error is critical and should lead to a graceful shutdown of the application.
 */
class DatabaseConnectionError extends ApiError {
  /**
   * @constructor
   * @param {Error} [originalError] - The original error that was caught.
   */
  constructor(originalError) {
    super(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      "system:db.connectionFailedAfterRetries",
      originalError ? [{ message: originalError.message, stack: originalError.stack }] : []
    );
  }
}

export default DatabaseConnectionError;