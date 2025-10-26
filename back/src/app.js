// index.js

// external imports
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

// local imports
import setupMiddleware from "./startup/middleware.js";
import setupRoutes from "./startup/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { NotFoundError } from "./errors/index.js";

// const
const app = express();

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
