import { authRouter } from "@auth/core";
import healthRouter from "../features/health/health.router.js";

/**
 * Sets up all the routes for the application.
 * @param {import('express').Application} app - The Express application instance.
 */
export default function setupRoutes(app) {
  const apiPrefix = "/api/v1";

  // Routes from @auth/core package
  app.use(`${apiPrefix}/auth`, authRouter);
  
  // Local routes
  app.use(`${apiPrefix}/health`, healthRouter);
}