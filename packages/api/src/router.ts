import { Router, type Router as IRouter, type RequestHandler } from "express";
import { authRoutes } from "./features/auth/index.js";
import testEmailRoutes from "./features/test-email/test-email.routes.js";
import { config } from "@auth/config";

/**
 * Router Dependencies
 */
export interface RouterDeps {
    authLimiter: RequestHandler;
    healthRoutes: IRouter;
}

/**
 * Create main API router factory
 *
 * Factory function that creates the main API router with injected dependencies.
 * Follows Gold Standard DI pattern.
 *
 * @param deps - Injected dependencies (authLimiter, healthRoutes)
 * @returns Express Router
 */
export function createRouter(deps: RouterDeps): IRouter {
    const { authLimiter, healthRoutes } = deps;
    const router: IRouter = Router();

    const API_VERSION = "v1";

    // API Version 1 Routes - Apply stricter auth rate limiter
    router.use(`/${API_VERSION}/auth`, authLimiter, authRoutes);

    // Utility Routes
    router.use("/health", healthRoutes);

    // Test routes - only available in non-production environments
    if (config.isTest || config.isDevelopment) {
        router.use("/test-email", testEmailRoutes);
    }

    return router;
}
