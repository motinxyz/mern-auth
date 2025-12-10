/**
 * @auth/contracts - Circuit Breaker Types
 *
 * State types for circuit breaker resilience patterns.
 */

/**
 * Circuit breaker state values.
 *
 * - `closed`: Normal operation, requests flow through
 * - `open`: Circuit tripped, requests fail fast
 * - `half-open`: Testing if service recovered
 * - `unknown`: State cannot be determined
 */
export type CircuitBreakerState = "closed" | "open" | "half-open" | "unknown";
