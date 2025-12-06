/**
 * Health Check Endpoints
 *
 * Production-grade health checks for Kubernetes/load balancers:
 * - /healthz  - Liveness probe (is the process alive?)
 * - /readyz   - Readiness probe (are dependencies ready to serve traffic?)
 */
import { HTTP_STATUS_CODES } from "@auth/utils";
import { redisConnection, getLogger } from "@auth/config";
import { getDatabaseService, getQueueServices } from "@auth/app-bootstrap";
const logger = getLogger().child({ module: "health" });
/**
 * Check Redis health
 * @returns {Promise<{healthy: boolean, latencyMs?: number, error?: string}>}
 */
async function checkRedis() {
    const start = Date.now();
    try {
        await redisConnection.ping();
        return {
            healthy: true,
            latencyMs: Date.now() - start,
        };
    }
    catch (error) {
        logger.warn({ err: error }, "Redis health check failed");
        return {
            healthy: false,
            error: error.message,
        };
    }
}
/**
 * Check Database health
 * @returns {Promise<{healthy: boolean, latencyMs?: number, error?: string}>}
 */
async function checkDatabase() {
    const start = Date.now();
    try {
        const dbService = getDatabaseService();
        await dbService.ping();
        return {
            healthy: true,
            latencyMs: Date.now() - start,
        };
    }
    catch (error) {
        logger.warn({ err: error }, "Database health check failed");
        return {
            healthy: false,
            error: error.message,
        };
    }
}
/**
 * Check Queue health
 * @returns {Promise<{healthy: boolean, circuitState?: string, error?: string}>}
 */
async function checkQueue() {
    try {
        const queueServices = getQueueServices();
        const health = await queueServices.emailQueueProducer.getHealth();
        return {
            healthy: health.healthy,
            circuitState: health.circuitBreaker?.state || "N/A",
        };
    }
    catch (error) {
        logger.warn({ err: error }, "Queue health check failed");
        return {
            healthy: false,
            error: error.message,
        };
    }
}
/**
 * Liveness probe handler - Is the process running?
 * Used by load balancers to check if the process should be restarted.
 */
export function livenessHandler(req, res) {
    res.status(HTTP_STATUS_CODES.OK).json({ status: "OK" });
}
/**
 * Readiness probe handler - Are dependencies ready to serve traffic?
 * Used by load balancers to determine if traffic should be routed to this instance.
 */
export async function readinessHandler(req, res) {
    const startTime = Date.now();
    // Check all dependencies in parallel
    const [redisHealth, dbHealth, queueHealth] = await Promise.all([
        checkRedis(),
        checkDatabase(),
        checkQueue(),
    ]);
    const isReady = redisHealth.healthy && dbHealth.healthy && queueHealth.healthy;
    const response = {
        status: isReady ? "READY" : "NOT_READY",
        timestamp: new Date().toISOString(),
        totalCheckMs: Date.now() - startTime,
        checks: {
            redis: redisHealth,
            database: dbHealth,
            queue: queueHealth,
        },
    };
    // Log if not ready (for debugging)
    if (!isReady) {
        logger.warn(response, "Readiness check failed");
    }
    res.status(isReady ? HTTP_STATUS_CODES.OK : 503).json(response);
}
//# sourceMappingURL=health.handlers.js.map