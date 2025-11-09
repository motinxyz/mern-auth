import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import { httpLogger, authLimiter } from '@auth/core';
import { config } from '@auth/config';
import expressMongoSanitize from '@exortek/express-mongo-sanitize';

const configureMiddleware = (app) => {
  // Enable CORS with secure options
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );

  // Set various security HTTP headers
  app.use(helmet());
  
  // Prevent HTTP Parameter Pollution
  app.use(hpp());
  
  // Sanitize data to prevent NoSQL injection
  app.use(expressMongoSanitize());

  // Parse json request body
  app.use(express.json());

  // Parse urlencoded request body
  app.use(express.urlencoded({ extended: true }));

  // Log HTTP requests
  app.use(httpLogger);
  
  // Apply rate limiting to auth routes
  app.use('/api/v1/auth', authLimiter);
};

export { configureMiddleware };
