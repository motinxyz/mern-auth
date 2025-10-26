import ApiError from "../core/api/ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class TooManyRequestsError extends ApiError {
  constructor() {
    super(HTTP_STATUS_CODES.TOO_MANY_REQUESTS, "common:errors.tooManyRequests");
  }
}

export default TooManyRequestsError;
