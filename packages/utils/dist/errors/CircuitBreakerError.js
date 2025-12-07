/**
 * CircuitBreakerError - Circuit breaker is open
 *
 * Thrown when a circuit breaker is open and requests are rejected.
 */
import { HttpError } from "./HttpError.js";
import { HTTP_STATUS_CODES } from "../http/index.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Circuit breaker open error (503)
 *
 * @example
 * ```typescript
 * throw new CircuitBreakerError("email:errors.circuitOpen");
 * ```
 */
export class CircuitBreakerError extends HttpError {
    constructor(message = "system:errors.circuitOpen") {
        super(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, message, ERROR_CODES.CIRCUIT_OPEN);
    }
}
export default CircuitBreakerError;
//# sourceMappingURL=CircuitBreakerError.js.map