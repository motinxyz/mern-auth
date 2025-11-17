import { v1Routes } from "../routes/v1/index.js";

const apiPrefixV1 = "/api/v1";
/**
 * Configures the application's routes.
 * @param {import('express').Express} app - The Express application.
 * @param {import('awilix').AwilixContainer} container - The Awilix DI container.
 */
const configureRoutes = (app, container) => {
  app.use(apiPrefixV1, v1Routes(container));
};

export { configureRoutes };
