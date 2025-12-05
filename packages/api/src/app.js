// app.js

// IMPORTANT: Sentry MUST be imported first!
import { Sentry } from "./middleware/core/sentry.js";

// external imports
import express from "express";
import compression from "compression";
import { swaggerUi, swaggerSpec, swaggerUiOptions } from "./swagger/index.js";
import { metricsMiddleware } from "./metrics/index.js";

// core imports
import { errorHandler, configureMiddleware } from "./middleware/index.js";
import { NotFoundError, HTTP_STATUS_CODES } from "@auth/utils";
import { i18nInstance, i18nMiddleware, redisConnection } from "@auth/config";
import { getDatabaseService } from "@auth/app-bootstrap";
import { apiLimiter } from "./middleware/index.js";
import {
  createTimeoutMiddleware,
  timeoutErrorHandler,
} from "./middleware/index.js";
import { apiVersionMiddleware } from "./middleware/index.js";

import router from "./router.js";
import { webhookRoutes } from "./features/webhooks/index.js";

// creates express router
const app = express();

// Apply request timeout (30 seconds) - MUST be early in middleware chain
app.use(...createTimeoutMiddleware(30000));

// Apply i18n middleware before any other middleware that might need it.
if (process.env.NODE_ENV === "test") {
  app.use((req, res, next) => {
    req.t = (key) => key;
    next();
  });
} else {
  app.use(i18nMiddleware.handle(i18nInstance));
}

// Sentry request/tracing is handled automatically by v8 SDK

// Setup core middleware (logging, body-parsing, etc.)
configureMiddleware(app);

// Sentry middleware for user context and breadcrumbs
import { sentryUserMiddleware } from "./middleware/sentry.middleware.js";
app.use(sentryUserMiddleware);

// Add compression middleware for response compression
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
  })
);

// Add metrics middleware to track HTTP requests
app.use(metricsMiddleware);

// Infrastructure health check for load balancers (Liveness)
app.get("/healthz", (req, res) => {
  res.status(HTTP_STATUS_CODES.OK).json({ status: "OK" });
});

// Webhooks mounted at root to avoid body-parsing middleware interference
app.use("/webhooks", webhookRoutes);

// Apply API versioning middleware
app.use(
  "/api",
  apiVersionMiddleware({
    currentVersion: "v1",
    // When v2 is ready, uncomment these:
    // deprecatedVersion: 'v1',
    // sunsetDate: 'Sat, 31 Dec 2025 23:59:59 GMT',
    // successorVersion: 'v2'
  })
);

// Apply global API rate limiter to all /api routes
app.use("/api", apiLimiter);

// Mount Main Router
app.use("/api", router);

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// Handle 404 - Not Found routes
app.use((req, res, next) => {
  next(new NotFoundError());
});

// Timeout error handler (MUST be before Sentry and global error handler)
app.use(timeoutErrorHandler);

// Sentry error handler (must be before other error handlers)
Sentry.setupExpressErrorHandler(app);

// Global error handler (must be the last middleware)
app.use(errorHandler);

export default app;
