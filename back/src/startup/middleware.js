import express from "express";
import { httpLogger } from "../middleware/loggerMiddleware.js";
import { i18nMiddleware } from "../middleware/i18nMiddleware.js";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import expressMongoSanitize from "@exortek/express-mongo-sanitize";

export default function (app) {
  // Add pino-http middleware for structured request logging
  //   app.use(pinoHttp({ logger }));
  app.use(httpLogger);

  // Attach translator to the request object
  app.use(i18nMiddleware);

  // Enable CORS - Cross-Origin Resource Sharing
  // In a real production app, you would configure this more strictly:
  // app.use(cors({ origin: 'https://your-frontend-domain.com' }));
  app.use(cors());

  // Set security HTTP headers
  app.use(helmet());
  app.use(hpp());

  // Add other core middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // mongo sanitize
  app.use(expressMongoSanitize())
}
