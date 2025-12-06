/**
 * Startup Logger
 *
 * A lightweight Pino logger for the startup phase, before the main logger is initialized.
 * Provides structured JSON logging with module context.
 *
 * NOTE: This logger intentionally uses process.env directly (not @auth/config)
 * because it runs BEFORE the config module is fully initialized.
 * Using config here would create a circular dependency.
 */

import pino from "pino";

// Must use process.env directly to avoid circular dependency with config module
const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Create the startup logger with pretty printing in development
 */
const startupLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: "auth-api",
    phase: "startup",
  },
});

/**
 * Create a child logger with module context
 * @param {string} module - Module name (e.g., 'tracing', 'metrics', 'shipper')
 * @returns {pino.Logger} Child logger with module context
 */
export function createModuleLogger(module) {
  return startupLogger.child({ module });
}
