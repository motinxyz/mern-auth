import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * Custom error for handling application configuration issues.
 * This error should be thrown when the application is misconfigured.
 */
class ConfigurationError extends ApiError {
  constructor(message) {
    super(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, message);
    this.name = "ConfigurationError";
  }
}

export default ConfigurationError;
