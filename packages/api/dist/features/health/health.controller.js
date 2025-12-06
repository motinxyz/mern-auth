import { getDatabaseService } from "@auth/app-bootstrap";
import { redisConnection, getLogger } from "@auth/config";
const logger = getLogger();
import { HTTP_STATUS_CODES } from "@auth/utils";
const healthLogger = logger.child({ module: "health" });
/* eslint-disable import/no-unused-modules */
export class HealthController {
    databaseService;
    redisConnection;
    constructor() {
        this.databaseService = getDatabaseService();
        this.redisConnection = redisConnection;
    }
    /**
     * Check health of all services
     * GET /api/health
     */
    checkHealth = async (req, res) => {
        try {
            // Perform actual ping to verify connectivity
            const [dbPing, redisPing] = await Promise.allSettled([
                this.databaseService.ping(),
                this.redisConnection.ping(),
            ]);
            const services = {
                mongodb: {
                    status: dbPing.status === "fulfilled" && dbPing.value ? "UP" : "DOWN",
                    readyState: this.databaseService.getConnectionState().readyState,
                },
                redis: {
                    status: redisPing.status === "fulfilled" && redisPing.value === "PONG"
                        ? "UP"
                        : "DOWN",
                    connectionStatus: this.redisConnection.status,
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
            res.status(HTTP_STATUS_CODES.OK).json({
                status: "READY",
                services,
            });
        }
        catch (error) {
            healthLogger.error({ error: error.message }, "Health check error");
            res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                status: "ERROR",
                message: "Internal server error during health check",
            });
        }
    };
}
export const healthController = new HealthController();
//# sourceMappingURL=health.controller.js.map