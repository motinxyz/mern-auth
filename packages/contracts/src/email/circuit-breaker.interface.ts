import type { CircuitBreakerState } from "../common/index.js";

/**
 * Health status of the email service circuit breaker.
 */
export interface CircuitBreakerHealth {
    /** Whether the circuit breaker has been initialized */
    readonly initialized: boolean;
    /** Current state of the circuit breaker */
    readonly state: CircuitBreakerState;
    /** In-memory statistics for monitoring */
    readonly inMemoryStats?: {
        readonly totalFires: number;
        readonly totalSuccesses: number;
        readonly totalFailures: number;
        readonly totalTimeouts: number;
        readonly totalRejects: number;
        readonly successRate: string;
        readonly lastStateChange: string | null;
    } | undefined;
    /** Raw circuit breaker statistics from the library */
    readonly circuitBreakerStats?: Readonly<Record<string, unknown>> | undefined;
}
