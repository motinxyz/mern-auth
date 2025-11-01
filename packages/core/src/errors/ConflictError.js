import ApiError from "../core/api/ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class ConflictError extends ApiError {
  constructor(message = "system:process.errors.conflict", errors = []) {
    // If a specific message (like 'validation:emailInUse') is provided, use it.
    // Otherwise, fall back to the generic conflict error message.
    // The 'errors' array provides detailed field-specific information.
    super(HTTP_STATUS_CODES.CONFLICT, message, errors);
  }
}

export default ConflictError;
