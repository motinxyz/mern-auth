// index.js

// external imports
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

// core imports
import {
  errorHandler,
  NotFoundError,
  setupMiddleware,
  i18nInstance,
  i18nMiddleware,
} from "@auth/core";

import setupRoutes from "./startup/routes.js";

// const
const app = express();

// Apply i18n middleware before any other middleware that might need it.
app.use(i18nMiddleware.handle(i18nInstance));

// Setup core middleware (logging, body-parsing, etc.)
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle 404 - Not Found routes
app.use((req, res, next) => {
  next(new NotFoundError());
});

// Global error handler (must be the last middleware)
app.use(errorHandler);

export default app;
