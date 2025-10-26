import pino from "pino";
import config from "../config/env.js";

const pinoConfig = {
  level: config.logLevel || "info",
  // In development, use pino-pretty for nicely formatted logs.
  // In production, this is disabled, and raw JSON logs are produced.
  transport: config.isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          sync: true,
          // Ignore verbose properties for cleaner development logs
          ignore: "pid,hostname",
          // A simple message format for general application logs.
          messageFormat: "{msg}",
        },
      }
    : undefined,
};

const logger = pino(pinoConfig);

export default logger;
