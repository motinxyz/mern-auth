/**
 * Circuit Breaker Error
 * Thrown when circuit breaker is open (service unavailable)
 */
export default class CircuitBreakerError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message?: string);
}
//# sourceMappingURL=CircuitBreakerError.d.ts.map