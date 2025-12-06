import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";
class ServiceUnavailableError extends ApiError {
    constructor(message = "system:process.errors.serviceUnavailable", errors = []) {
        super(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, message, errors);
    }
}
export default ServiceUnavailableError;
//# sourceMappingURL=ServiceUnavailableError.js.map