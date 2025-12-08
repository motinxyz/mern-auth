/**
 * Health Check Endpoints
 *
 * Production-grade health checks for Kubernetes/load balancers:
 * - /healthz  - Liveness probe (is the process alive?)
 * - /readyz   - Readiness probe (are dependencies ready to serve traffic?)
 */

import { HTTP_STATUS_CODES, withSpan, addSpanAttributes } from "@auth/utils";
import { getLogger, redisConnection } from "@auth/config";
import { checkBootstrapHealth } from "@auth/app-bootstrap";
import type { Request, Response } from "express";

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn({ err: error }, "Redis health check failed");
    return {
      healthy: false,
      error: message,
    };
  }
}

/**
 * Liveness probe handler - Is the process running?
 * Used by load balancers to check if the process should be restarted.
 */
export function livenessHandler(_req: Request, res: Response) {
  res.status(HTTP_STATUS_CODES.OK).json({ status: "OK" });
}

/**
 * Readiness probe handler - Are dependencies ready to serve traffic?
 * Used by load balancers to determine if traffic should be routed to this instance.
 */
export async function readinessHandler(_req: Request, res: Response) {
  await withSpan("api.health.readiness", async () => {
    const startTime = Date.now();

    // Check all dependencies in parallel
    // Uses centralized bootstrap health check for DB and Email
    const [redisHealth, bootstrapHealth] = await Promise.all([
      checkRedis(),
      checkBootstrapHealth(),
    ]);

    const isReady =
      redisHealth.healthy && bootstrapHealth.healthy;

    const response = {
      status: isReady ? "READY" : "NOT_READY",
      timestamp: new Date().toISOString(),
      totalCheckMs: Date.now() - startTime,
      checks: {
        redis: redisHealth,
        database: bootstrapHealth.database,
        email: bootstrapHealth.email,
        queues: bootstrapHealth.queues,
      },
    };

    addSpanAttributes({
      "health.status": response.status,
      "health.ready": isReady,
      "health.latency_ms": response.totalCheckMs,
    });

    // Log if not ready (for debugging)
    if (!isReady) {
      logger.warn(response, "Readiness check failed");
    }

    res.status(isReady ? HTTP_STATUS_CODES.OK : 503).json(response);
  });
}
