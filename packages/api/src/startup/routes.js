import { v1Routes } from "../routes/v1/index.js";

const apiPrefixV1 = "/api/v1";
/**
 * Configures the application's routes.
 * @param {import('express').Express} app - The Express application.
 */
const configureRoutes = (app) => {
  app.use(apiPrefixV1, v1Routes);
};

export { configureRoutes };
