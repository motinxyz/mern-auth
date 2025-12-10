/**
 * @auth/contracts - Health Check Interface
 *
 * Base interface for service health check results.
 */

/**
 * Base interface for all health check results.
 * All service health checks should extend or implement this interface.
 *
 * @example
 * ```typescript
 * interface IDatabaseHealth extends IHealthResult {
 *   readonly connectionCount: number;
 * }
 * ```
 */
export interface IHealthResult {
    /** Whether the service is healthy and operational */
    readonly healthy: boolean;
    /** Optional error message if unhealthy */
    readonly error?: string | undefined;
}
