import type { Request, Response } from "express";
import type { IDatabaseService, IRedisConnection } from "@auth/contracts";
import { getLogger } from "@auth/app-bootstrap";
import { HTTP_STATUS_CODES } from "@auth/utils";

const logger = getLogger();
const healthLogger = logger.child({ module: "health" });

/**
 * Health Controller Dependencies
 */
export interface HealthControllerDeps {
  redis: IRedisConnection;
  databaseService: IDatabaseService;
}

/**
 * Health Controller
 *
 * Handles health check endpoints with injected dependencies.
 */
export class HealthController {
  private readonly redis: IRedisConnection;
  private readonly databaseService: IDatabaseService;

  constructor(deps: HealthControllerDeps) {
    this.redis = deps.redis;
    this.databaseService = deps.databaseService;
  }

  /**
   * Check health of all services
   * GET /api/health
   */
  checkHealth = async (_req: Request, res: Response) => {
    try {
      const [dbPing, redisPing] = await Promise.allSettled([
        this.databaseService.ping(),
        this.redis.ping(),
      ]);

      const services = {
        mongodb: {
          status: dbPing.status === "fulfilled" && dbPing.value ? "UP" : "DOWN",
          readyState: this.databaseService.getConnectionState().readyState,
        },
        redis: {
          status: redisPing.status === "fulfilled" && redisPing.value === "PONG" ? "UP" : "DOWN",
          connectionStatus: this.redis.status,
        },
      };

      const allHealthy = services.mongodb.status === "UP" && services.redis.status === "UP";

      healthLogger.debug({ services, allHealthy }, "Health check performed");

      if (!allHealthy) {
        return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
          status: "NOT_READY",
          message: "One or more services are unavailable",
          services,
        });
      }

      return res.status(HTTP_STATUS_CODES.OK).json({ status: "READY", services });
    } catch (error) {
      healthLogger.error({ error: (error as Error).message }, "Health check error");
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        status: "ERROR",
        message: "Internal server error during health check",
      });
    }
  };
}

/**
 * Create Health Controller factory
 */
export function createHealthController(deps: HealthControllerDeps): HealthController {
  return new HealthController(deps);
}
