/**
 * ServiceUnavailableError - Service temporarily unavailable
 *
 * Thrown when a service is temporarily unavailable.
 */
import { HttpError } from "../base/HttpError.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import { ERROR_CODES } from "../../types/index.js";
/**
 * Service unavailable error (503)
 *
 * @example
 * ```typescript
 * throw new ServiceUnavailableError("system:errors.serviceDown");
 * ```
 */
export class ServiceUnavailableError extends HttpError {
    constructor(message = "system:errors.serviceUnavailable") {
        super(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, message, ERROR_CODES.SERVICE_UNAVAILABLE);
    }
}
export default ServiceUnavailableError;
//# sourceMappingURL=ServiceUnavailableError.js.map