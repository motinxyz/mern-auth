/**
 * CircuitBreakerError - Circuit breaker is open
 *
 * Thrown when a circuit breaker is open and requests are rejected.
 */
import { HttpError } from "./HttpError.js";
/**
 * Circuit breaker open error (503)
 *
 * @example
 * ```typescript
 * throw new CircuitBreakerError("email:errors.circuitOpen");
 * ```
 */
export declare class CircuitBreakerError extends HttpError {
    constructor(message?: string);
}
export default CircuitBreakerError;
//# sourceMappingURL=CircuitBreakerError.d.ts.map