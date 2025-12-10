// app.js

// IMPORTANT: Sentry MUST be imported first!
import { Sentry } from "./middleware/core/sentry.js";

// external imports
import express from "express";
import compression from "compression";
import { swaggerUi, swaggerSpec, swaggerUiOptions } from "./swagger/index.js";
import { metricsMiddleware } from "./metrics/index.js";

// core imports
import { errorHandler, configureMiddleware, createMiddleware } from "./middleware/index.js";
import { NotFoundError } from "@auth/utils";
import {
  i18nInstance,
  i18nMiddleware,
  config,
} from "@auth/config";
import { getRedisService, getDatabaseService } from "@auth/app-bootstrap";
import type { Request, Response, NextFunction } from "express";
import {
  createTimeoutMiddleware,
  timeoutErrorHandler,
  apiVersionMiddleware,
} from "./middleware/index.js";
import { createRouter } from "./router.js";
import { webhookRoutes } from "./features/webhooks/index.js";

// creates express router
const app = express();

// Trust first proxy (Render, Railway, etc.)
if (config.isProduction) {
  app.set("trust proxy", 1);
}

// Apply request timeout (30 seconds)
app.use(...createTimeoutMiddleware(30000));

// Apply i18n middleware
if (config.isTest === true) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.t = ((key: string) => key) as typeof req.t;
    next();
  });
} else {
  app.use(i18nMiddleware.handle(i18nInstance));
}

// Setup core middleware (logging, body-parsing, etc.)
configureMiddleware(app);

// Sentry middleware for user context and breadcrumbs
import { sentryUserMiddleware } from "./middleware/sentry.middleware.js";
app.use(sentryUserMiddleware);

// Add compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"] !== undefined) return false;
      return compression.filter(req, res);
    },
    level: 6,
  })
);

// Add metrics middleware
app.use(metricsMiddleware);

// ============================================================================
// COMPOSITION ROOT - Create all dependencies with DI
// ============================================================================
const redis = getRedisService();
const databaseService = getDatabaseService();
const middleware = createMiddleware({ redis, databaseService });
const router = createRouter({
  authLimiter: middleware.authLimiter,
  healthRoutes: middleware.healthRoutes,
});

// Health check endpoints (for load balancers/Kubernetes)
app.get("/healthz", middleware.livenessHandler);
app.get("/readyz", middleware.readinessHandler);

// Webhooks mounted at root
app.use("/webhooks", webhookRoutes);

// Apply API versioning middleware
app.use("/api", apiVersionMiddleware({ currentVersion: "v1" }));

// Apply global API rate limiter
app.use("/api", middleware.apiLimiter);

// Mount Main Router (includes /api/health and /api/v1/auth)
app.use("/api", router);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Handle 404
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError());
});

// Timeout error handler
app.use(timeoutErrorHandler);

// Sentry error handler
Sentry.setupExpressErrorHandler(app);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
