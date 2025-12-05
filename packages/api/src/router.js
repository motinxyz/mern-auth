import { Router } from "express";
import { authRoutes } from "./features/auth/index.js";
import { healthRoutes } from "./features/health/index.js";
import testEmailRoutes from "./features/test-email/test-email.routes.js";
import { authLimiter } from "./middleware/index.js";

const router = Router();

const apiVersion = "v1";
// API Version 1 Routes - Apply stricter auth rate limiter
router.use(`/${apiVersion}/auth`, authLimiter, authRoutes);

// Utility Routes (Specific paths)
router.use("/health", healthRoutes);
router.use("/test-email", testEmailRoutes);

export default router;
