import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import mongoSanitize from '@exortek/express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { configureRoutes } from './startup/routes.js';
import container from './container.js';
import { errorHandlerFactory, loggerMiddlewareFactory } from '@auth/core';
import { ApiError, HTTP_STATUS_CODES, ApiResponse } from '@auth/utils';
import mongoose from 'mongoose';
import { i18nMiddleware } from '@auth/config'; // Import i18nMiddleware

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(hpp());
app.use(mongoSanitize());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// i18n Middleware
app.use(i18nMiddleware.handle(container.resolve('i18nInstance'))); // Apply i18nMiddleware

// HTTP Logger
app.use(container.resolve('httpLogger'));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthz endpoint
app.get('/healthz', async (req, res) => {
  const { redisConnection, t, logger } = container.cradle;

  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'OK' : 'Error';
    const redisStatus = redisConnection && redisConnection.status === 'ready' ? 'OK' : 'Error';

    const overallStatus = dbStatus === 'OK' && redisStatus === 'OK' ? 'healthy' : 'unhealthy';
    const statusCode = overallStatus === 'healthy' ? HTTP_STATUS_CODES.OK : HTTP_STATUS_CODES.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json(new ApiResponse(
      statusCode,
      {
        timestamp: new Date().toISOString(),
        status: overallStatus,
        db: dbStatus,
        redis: redisStatus,
      },
      t('system:server.healthCheck')
    ));
  } catch (error) {
    logger.error(error, 'Unexpected error during health check.');
    const statusCode = HTTP_STATUS_CODES.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(new ApiResponse(
      statusCode,
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        db: 'Error',
        redis: 'Error',
        details: 'An unexpected error occurred during the health check.'
      },
      t('system:server.healthCheck')
    ));
  }
});

// Configure routes
configureRoutes(app, container);

// Not found handler
app.use((req, res, next) => {
  next(new ApiError(HTTP_STATUS_CODES.NOT_FOUND, 'system:process.errors.notFound'));
});

// Error handler
app.use(container.resolve('errorHandler'));

export default app;
