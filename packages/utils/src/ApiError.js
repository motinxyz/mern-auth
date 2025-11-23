/**
 * @class ApiError
 * @extends Error
 * @description A standardized error class for API responses.
 * @param {number} statusCode - The HTTP status code.
 * @param {string} message - The error message (translation key).
 * @param {Array} errors - A list of detailed error objects.
 * @param {string} stack - The error stack trace.
 */
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    // Overwrite the constructor arguments to ensure they are set
    this.statusCode = statusCode || 500;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
