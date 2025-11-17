/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health check operations
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check the health of the API service
 *     tags: [Health]
 *     description: Returns the current health status of the API, including database and Redis connection status.
 *     responses:
 *       200:
 *         description: API is healthy and operational.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "System is healthy and operational"
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-10-27T10:00:00.000Z"
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     db:
 *                       type: string
 *                       example: "OK"
 *                     redis:
 *                       type: string
 *                       example: "OK"
 *       503:
 *         description: API is unhealthy due to issues with dependent services (e.g., database, Redis).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "System is unhealthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-10-27T10:00:00.000Z"
 *                     status:
 *                       type: string
 *                       example: "unhealthy"
 *                     db:
 *                       type: string
 *                       example: "Error"
 *                     redis:
 *                       type: string
 *                       example: "OK"
 */
import { Router } from "express";
import { HTTP_STATUS_CODES, ApiResponse } from "@auth/utils";

export default (container) => {
  const { logger, t } = container.cradle;
  const healthLogger = logger.child({ module: "health" });
  const router = Router();

  router.get("/", (req, res) => {
    healthLogger.info("Health check endpoint was called");

    const healthInfo = {
      timestamp: new Date().toISOString(),
      status: "healthy"
    };
    
    return res
      .status(HTTP_STATUS_CODES.OK)
      .json(new ApiResponse(
        HTTP_STATUS_CODES.OK,
        healthInfo,
        t("system:server.healthCheck") // Use t from container.cradle
      ));
  });

  return router;
};
