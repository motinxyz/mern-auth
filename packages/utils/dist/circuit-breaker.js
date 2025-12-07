/**
 * Circuit Breaker Utilities
 *
 * Production-grade circuit breaker wrapper for async operations.
 * Uses the opossum library with sensible defaults.
 *
 * @see https://github.com/nodeshift/opossum
 */
import CircuitBreaker from "opossum";
/**
 * Default configuration for circuit breakers
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    volumeThreshold: 5,
    capacity: 50,
    name: "CircuitBreaker",
};
/**
 * Create a circuit breaker for async operations
 *
 * @template TArgs - Arguments type for the operation
 * @template TResult - Return type of the operation
 * @param operation - The async operation to wrap
 * @param options - Circuit breaker configuration
 * @returns A configured circuit breaker instance
 *
 * @example
 * ```typescript
 * const emailBreaker = createCircuitBreaker(
 *   async (to: string, body: string) => sendEmail(to, body),
 *   { timeout: 5000, name: "emailService" }
 * );
 *
 * // Use the circuit breaker
 * const result = await emailBreaker.fire("user@example.com", "Hello!");
 * ```
 */
export function createCircuitBreaker(operation, options = {}) {
    const config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...options };
    return new CircuitBreaker(operation, config);
}
//# sourceMappingURL=circuit-breaker.js.map