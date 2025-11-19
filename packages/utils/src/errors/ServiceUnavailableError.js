import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class ServiceUnavailableError extends ApiError {
  constructor(
    message = "system:process.errors.serviceUnavailable",
    errors = [],
    details = {}
  ) {
    super(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, message, errors, {
      ...details,
      translationKey: message,
    });
  }
}

export default ServiceUnavailableError;
