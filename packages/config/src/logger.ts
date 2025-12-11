/**
 * Logger Factory
 * Provides a Pino logger for the config package and its consumers.
 *
 * NOTE: This is a simple logger that doesn't depend on @auth/observability
 * to avoid circular dependencies. For production logging with Loki integration,
 * use getObservabilityLogger from @auth/observability.
 */

import pino, { type Logger } from "pino";
import config from "./env.js";

let loggerInstance: Logger | undefined;

/**
 * Get a configured Pino logger
 * Uses pretty printing in development, JSON in production
 */
export function getLogger(): Logger {
  if (loggerInstance === undefined) {
    const isDevelopment = config.isDevelopment;

    if (isDevelopment) {
      loggerInstance = pino({
        level: config.logLevel ?? "info",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
        redact: {
          paths: [
            "password",
            "token",
            "secret",
            "apiKey",
            "authorization",
            "cookie",
            "*.password",
            "*.token",
            "*.secret",
          ],
          remove: true,
        },
      });
    } else {
      // Production: Plain JSON logger
      // For Loki integration, use @auth/observability getObservabilityLogger
      loggerInstance = pino({
        level: config.logLevel ?? "info",
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: {
          paths: [
            "password",
            "token",
            "secret",
            "apiKey",
            "authorization",
            "cookie",
            "*.password",
            "*.token",
            "*.secret",
          ],
          remove: true,
        },
      });
    }
  }
  return loggerInstance;
}
