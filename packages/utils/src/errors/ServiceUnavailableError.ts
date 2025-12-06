import ApiError from "../ApiError.js";
import type { ValidationError } from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class ServiceUnavailableError extends ApiError {
  constructor(
    message: string = "system:process.errors.serviceUnavailable",
    errors: ValidationError[] = []
  ) {
    super(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, message, errors);
  }
}

export default ServiceUnavailableError;
