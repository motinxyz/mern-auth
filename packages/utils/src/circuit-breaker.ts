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
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
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
export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  options: CircuitBreakerConfig = {}
): CircuitBreaker<TArgs, TResult> {
  const config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...options };
  return new CircuitBreaker(operation, config);
}
