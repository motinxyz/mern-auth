import { Router } from "express";
import { healthController } from "./health.controller.js";
const router = Router();
/**
 * Detailed health check endpoint (Readiness Probe)
 * GET /api/health
 *
 * Checks MongoDB and Redis connectivity with actual ping
 * Returns 200 if all services are healthy, 503 otherwise
 */
router.get("/", healthController.checkHealth);
export default router;
//# sourceMappingURL=health.routes.js.map