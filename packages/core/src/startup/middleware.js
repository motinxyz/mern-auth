import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { config } from "@auth/config";
import { errorHandler } from "@auth/core";
import { authLimiter } from "../middleware/rateLimiter.js";
import expressMongoSanitize from "@exortek/express-mongo-sanitize";

export default function setupMiddleware(app) {
  // Security middleware
  app.use(helmet()); // Set security HTTP headers
  app.use(hpp()); // Prevent HTTP Parameter Pollution attacks
  app.use(expressMongoSanitize()); // Sanitize data to prevent NoSQL injection

  // Core Express middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS setup
  app.use(
    cors({
      origin: config.isDevelopment ? true : config.clientUrl,
      credentials: true,
    })
  );

  // Rate limiting
  app.use(authLimiter);

  // Global error handler
  app.use(errorHandler);
}
