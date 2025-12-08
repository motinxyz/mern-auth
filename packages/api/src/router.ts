import { Router, type Router as IRouter } from "express";
import { authRoutes } from "./features/auth/index.js";
import { healthRoutes } from "./features/health/index.js";
import testEmailRoutes from "./features/test-email/test-email.routes.js";
import { authLimiter } from "./middleware/index.js";
import { config } from "@auth/config";

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

export default router;
