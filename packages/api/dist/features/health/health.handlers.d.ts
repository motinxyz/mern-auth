/**
 * Health Check Endpoints
 *
 * Production-grade health checks for Kubernetes/load balancers:
 * - /healthz  - Liveness probe (is the process alive?)
 * - /readyz   - Readiness probe (are dependencies ready to serve traffic?)
 */
/**
 * Liveness probe handler - Is the process running?
 * Used by load balancers to check if the process should be restarted.
 */
export declare function livenessHandler(req: any, res: any): void;
/**
 * Readiness probe handler - Are dependencies ready to serve traffic?
 * Used by load balancers to determine if traffic should be routed to this instance.
 */
export declare function readinessHandler(req: any, res: any): Promise<void>;
//# sourceMappingURL=health.handlers.d.ts.map