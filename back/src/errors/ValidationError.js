import ApiError from "../core/api/ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class ValidationError extends ApiError {
  constructor(errors = []) {
    super(
      HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT,
      "validation:default",
      errors
    );
  }
}

export default ValidationError;
