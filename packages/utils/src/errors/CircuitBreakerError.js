/**
 * Circuit Breaker Error
 * Thrown when circuit breaker is open (service unavailable)
 */
export default class CircuitBreakerError extends Error {
  constructor(
    message = "Service temporarily unavailable - circuit breaker is open"
  ) {
    super(message);
    this.name = "CircuitBreakerError";
    this.code = "CIRCUIT_OPEN";
    this.statusCode = 503; // Service Unavailable
    Error.captureStackTrace(this, this.constructor);
  }
}
