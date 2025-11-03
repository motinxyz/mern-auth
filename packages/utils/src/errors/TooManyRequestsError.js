import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

class TooManyRequestsError extends ApiError {
  constructor(retryAfter = 300) { // Default to 5 minutes
    super(
      HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
      "system:process.errors.tooManyRequests",
      [{
        field: "request",
        message: "system:process.errors.tooManyRequests",
        context: { retryAfter }
      }]
    );
  }
}

export default TooManyRequestsError;
