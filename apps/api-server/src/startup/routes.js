import authRouter from "../features/auth/auth.router.js";
import healthRouter from "../features/health/health.router.js";

/**
 * Sets up all the routes for the application.
 * @param {import('express').Application} app - The Express application instance.
 */
export default function setupRoutes(app) {
  const apiPrefix = "/api/v1";

  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/health`, healthRouter);
}