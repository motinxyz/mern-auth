import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Good practice for security
import { httpLogger } from '@auth/core'; // Import httpLogger from @auth/core

const setupMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(cors());

  // Parse json request body
  app.use(express.json());

  // Parse urlencoded request body
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logger using the centralized httpLogger from @auth/core
  app.use(httpLogger);
};

export default setupMiddleware;