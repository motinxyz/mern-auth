/**
 * @auth/logger
 *
 * Zero-dependency logger package at the bottom of the dependency tree.
 * Reads configuration directly from process.env to avoid circular dependencies.
 *
 * Usage:
 * ```typescript
 * import { createLogger } from "@auth/logger";
 * const logger = createLogger();
 * ```
 */

import pino, { type Logger, type LoggerOptions } from "pino";
import { REDACT_PATHS } from "./constants.js";
import { getLokiConfig, getLogConfig } from "./utils.js";
import type { CreateLoggerOptions } from "./types/index.js";

export type { CreateLoggerOptions } from "./types/index.js";

/**
 * Create a Pino logger
 *
 * - Development: Pretty-printed console output + file logging
 * - Production: JSON output or Loki transport
 *
 * @param options - Optional configuration
 * @returns Configured Pino logger
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
    const config = getLogConfig();

    // Default values
    const level = options.level ?? config.level ?? "info";
    const serviceName = options.serviceName ?? config.serviceName;

    const baseConfig: LoggerOptions = {
        level,
        base: {
            service: serviceName,
            ...options.base,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label: string) => ({ level: label }),
        },
        redact: {
            paths: REDACT_PATHS,
            remove: true,
        },
        mixin: options.mixin,
    };

    // Development: Pretty printing + File logging
    if (config.isDevelopment) {
        const devConfig: LoggerOptions = { ...baseConfig };
        // Transport doesn't support formatters in main config
        delete devConfig.formatters;

        return pino({
            ...devConfig,
            transport: {
                targets: [
                    {
                        target: "pino-pretty",
                        options: {
                            colorize: true,
                            translateTime: "HH:MM:ss Z",
                            ignore: "pid,hostname",
                            destination: 1, // stdout
                        },
                    },
                    {
                        target: "pino/file",
                        options: {
                            destination: "./logs/app.log",
                            mkdir: true,
                        },
                    },
                ],
            },
        });
    }

    // Production: Check for Loki configuration
    const lokiConfig = getLokiConfig();

    if (lokiConfig) {
        return pino({
            ...baseConfig,
            transport: {
                target: "pino-loki",
                options: {
                    batching: true,
                    interval: 5, // Ship every 5 seconds
                    host: lokiConfig.url.replace(/\/$/, ""), // No trailing slash
                    basicAuth: {
                        username: lokiConfig.user,
                        password: lokiConfig.apiKey,
                    },
                    labels: {
                        app: serviceName,
                        environment: config.environment,
                    },
                    replaceTimestamp: true,
                    silenceErrors: false,
                    propsToLabels: [],
                },
            },
        });
    }

    // Production fallback: Plain JSON to stdout
    return pino(baseConfig);
}

// Re-export Logger type for consumers
export type { Logger } from "pino";
