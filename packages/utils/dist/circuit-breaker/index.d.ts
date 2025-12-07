/**
 * Circuit Breaker Module
 *
 * Production-grade circuit breaker wrapper for async operations.
 * Uses the opossum library with sensible defaults.
 *
 * @see https://github.com/nodeshift/opossum
 */
import CircuitBreaker from "opossum";
/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerConfig {
    /** Timeout in milliseconds for the operation */
    readonly timeout?: number;
    /** Percentage of failures before opening the circuit */
    readonly errorThresholdPercentage?: number;
    /** Time in ms before attempting to close an open circuit */
    readonly resetTimeout?: number;
    /** Time window for calculating error threshold */
    readonly rollingCountTimeout?: number;
    /** Number of buckets in the rolling window */
    readonly rollingCountBuckets?: number;
    /** Minimum number of requests before calculating error threshold */
    readonly volumeThreshold?: number;
    /** Maximum concurrent requests allowed */
    readonly capacity?: number;
    /** Name for the circuit breaker (for logging) */
    readonly name?: string;
}
/**
 * Default configuration for circuit breakers
 */
export declare const DEFAULT_CIRCUIT_BREAKER_CONFIG: Readonly<CircuitBreakerConfig>;
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
export declare function createCircuitBreaker<TArgs extends unknown[], TResult>(operation: (...args: TArgs) => Promise<TResult>, options?: CircuitBreakerConfig): CircuitBreaker<TArgs, TResult>;
//# sourceMappingURL=index.d.ts.map