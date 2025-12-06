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
    name: "CircuitBreaker",
};
/**
 * Create a circuit breaker for async operations
 */
export function createCircuitBreaker(operation, options = {}) {
    const config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...options };
    return new CircuitBreaker(operation, config);
}
//# sourceMappingURL=circuit-breaker.js.map