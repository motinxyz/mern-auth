import { Router } from "express";
import type { HealthController } from "./health.controller.js";

/**
 * Create health routes factory
 *
 * Factory function that creates health routes with injected controller.
 * Follows Gold Standard DI pattern.
 *
 * @param healthController - Injected HealthController instance
 * @returns Express Router with health routes
 */
export function createHealthRoutes(healthController: HealthController): Router {
    const router = Router();

    /**
     * Detailed health check endpoint (Readiness Probe)
     * GET /api/health
     *
     * Checks MongoDB and Redis connectivity with actual ping
     * Returns 200 if all services are healthy, 503 otherwise
     */
    router.get("/", healthController.checkHealth);

    return router;
}
