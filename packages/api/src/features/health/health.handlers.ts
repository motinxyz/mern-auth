/**
 * Health Check Endpoints
 *
 * Production-grade health checks for Kubernetes/load balancers:
 * - /healthz  - Liveness probe (is the process alive?)
 * - /readyz   - Readiness probe (are dependencies ready to serve traffic?)
 */

import type { IRedisConnection } from "@auth/contracts";
import { HTTP_STATUS_CODES } from "@auth/utils";
import { withSpan, addSpanAttributes } from "@auth/observability";
import { getLogger } from "@auth/app-bootstrap";
import { checkBootstrapHealth } from "@auth/app-bootstrap";
import type { Request, Response, RequestHandler } from "express";

const logger = getLogger().child({ module: "health" });

/**
 * Health Handlers Dependencies
 */
export interface HealthHandlersDeps {
  redis: IRedisConnection;
}

/**
 * Liveness probe handler - Is the process running?
 */
export function livenessHandler(_req: Request, res: Response) {
  res.status(HTTP_STATUS_CODES.OK).json({ status: "OK" });
}

/**
 * Create readiness handler factory
 *
 * @param deps - Injected dependencies
 * @returns Express request handler
 */
export function createReadinessHandler(deps: HealthHandlersDeps): RequestHandler {
  const { redis } = deps;

  async function checkRedis() {
    const start = Date.now();
    try {
      await redis.ping();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn({ err: error }, "Redis health check failed");
      return { healthy: false, error: message };
    }
  }

  return async (_req: Request, res: Response) => {
    await withSpan("api.health.readiness", async () => {
      const startTime = Date.now();

      const [redisHealth, bootstrapHealth] = await Promise.all([
        checkRedis(),
        checkBootstrapHealth(),
      ]);

      const isReady = redisHealth.healthy && bootstrapHealth.healthy;

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

      if (!isReady) {
        logger.warn(response, "Readiness check failed");
      }

      res.status(isReady ? HTTP_STATUS_CODES.OK : 503).json(response);
    });
  };
}
