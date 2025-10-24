import ApiError from "../core/api/ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class ConflictError extends ApiError {
  constructor(message = "common:errors.conflict", errors = []) {
    super(HTTP_STATUS_CODES.CONFLICT, message, errors);
  }
}

export default ConflictError;
