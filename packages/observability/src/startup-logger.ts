/**
 * Startup Logger
 *
 * A lightweight Pino logger for the startup phase, before the main logger is initialized.
 * Provides structured JSON logging with module context.
 *
 * NOTE: This logger intentionally uses process.env directly
 * because it runs BEFORE the config module is fully initialized.
 */

import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Create the startup logger with pretty printing in development
 */
const startupLogger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    ...(isDevelopment && {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname",
            },
        },
    }),
    base: {
        service: process.env.OTEL_SERVICE_NAME ?? "auth-api",
        phase: "startup",
    },
});

/**
 * Create a child logger with module context
 * @param module - Module name (e.g., 'tracing', 'metrics')
 * @returns Child logger with module context
 */
export function createModuleLogger(module: string): pino.Logger {
    return startupLogger.child({ module });
}
