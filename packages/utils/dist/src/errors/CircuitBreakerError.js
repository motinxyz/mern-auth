/**
 * Circuit Breaker Error
 * Thrown when circuit breaker is open (service unavailable)
 */
export default class CircuitBreakerError extends Error {
    code;
    statusCode;
    constructor(message = "Service temporarily unavailable - circuit breaker is open") {
        super(message);
        this.name = "CircuitBreakerError";
        this.code = "CIRCUIT_OPEN";
        this.statusCode = 503;
        Error.captureStackTrace(this, this.constructor);
    }
}
//# sourceMappingURL=CircuitBreakerError.js.map