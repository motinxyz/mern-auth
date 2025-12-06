import CircuitBreaker from "opossum";
/**
 * Circuit Breaker Configuration Options
 */
export interface CircuitBreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
}
/**
 * Default configuration for circuit breakers
 */
export declare const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig;
/**
 * Create a circuit breaker for async operations
 */
export declare function createCircuitBreaker<TArgs extends unknown[], TResult>(operation: (...args: TArgs) => Promise<TResult>, options?: CircuitBreakerConfig): CircuitBreaker<TArgs, TResult>;
//# sourceMappingURL=circuit-breaker.d.ts.map