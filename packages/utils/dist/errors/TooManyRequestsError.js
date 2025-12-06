import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";
class TooManyRequestsError extends ApiError {
    retryAfter;
    constructor(retryAfter = 300) {
        super(HTTP_STATUS_CODES.TOO_MANY_REQUESTS, "system:process.errors.tooManyRequests");
        this.retryAfter = retryAfter;
    }
}
export default TooManyRequestsError;
//# sourceMappingURL=TooManyRequestsError.js.map