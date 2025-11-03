import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Good practice for security
import morgan from 'morgan'; // For request logging
import { config, logger } from '@auth/config';

const setupMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(cors());

  // Parse json request body
  app.use(express.json());

  // Parse urlencoded request body
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logger
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
  }
};

export default setupMiddleware;