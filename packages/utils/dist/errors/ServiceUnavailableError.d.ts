/**
 * ServiceUnavailableError - Service temporarily unavailable
 *
 * Thrown when a service is temporarily unavailable.
 */
import { HttpError } from "./HttpError.js";
/**
 * Service unavailable error (503)
 *
 * @example
 * ```typescript
 * throw new ServiceUnavailableError("system:errors.serviceDown");
 * ```
 */
export declare class ServiceUnavailableError extends HttpError {
    constructor(message?: string);
}
export default ServiceUnavailableError;
//# sourceMappingURL=ServiceUnavailableError.d.ts.map