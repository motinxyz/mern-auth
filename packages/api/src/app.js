// app.js

// external imports
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

// core imports
import {
  errorHandler,
} from "@auth/core";
import { configureMiddleware } from "./startup/middleware.js";
import { NotFoundError } from "@auth/utils";
import { i18nInstance, i18nMiddleware } from "@auth/config";
import mongoose from "@auth/database";
import { redisConnection } from "@auth/config/redis";

import { configureRoutes } from "./startup/routes.js";

// const
const app = express();

// Apply i18n middleware before any other middleware that might need it.
if (process.env.NODE_ENV === "test") {
  app.use((req, res, next) => {
    req.t = (key) => key;
    next();
  });
} else {
  app.use(i18nMiddleware.handle(i18nInstance));
}

// Setup core middleware (logging, body-parsing, etc.)
configureMiddleware(app); // New call

// Health check endpoint
app.get("/healthz", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "OK" : "Error";
  const redisStatus = redisConnection.status === "ready" ? "OK" : "Error";
  
  if (dbStatus === "OK" && redisStatus === "OK") {
    res.status(200).json({ status: "OK", db: dbStatus, redis: redisStatus });
  } else {
    res.status(503).json({ status: "Error", db: dbStatus, redis: redisStatus });
  }
});

// Setup routes
configureRoutes(app);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle 404 - Not Found routes
app.use((req, res, next) => {
  next(new NotFoundError());
});

// Global error handler (must be the last middleware)
app.use(errorHandler);

export default app;