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

// Force IPv4 preference for all network connections
// Fixes ETIMEDOUT errors when shipping to Grafana Cloud from environments that prefer IPv6
import dns from "node:dns";
try {
    dns.setDefaultResultOrder("ipv4first");
} catch {
    // Ignore if node version doesn't support this
}

/**
 * Logger configuration options
 */
export interface CreateLoggerOptions {
    /** Log level (default: from LOG_LEVEL env or "info") */
    level?: string;
    /** Service name for structured logs */
    serviceName?: string;
    /** Additional base fields */
    base?: Record<string, unknown>;
    /** Mixin function for adding dynamic fields */
    mixin?: () => Record<string, unknown>;
}

/**
 * Loki configuration from environment
 */
interface LokiConfig {
    url: string;
    user: string;
    apiKey: string;
}

/**
 * Get Loki configuration from environment
 */
function getLokiConfig(): LokiConfig | null {
    const url = process.env.GRAFANA_LOKI_URL;
    const user = process.env.GRAFANA_LOKI_USER;
    const apiKey = process.env.GRAFANA_LOKI_API_KEY;

    if (url && user && apiKey) {
        return { url, user, apiKey };
    }
    return null;
}

/**
 * Paths to redact from logs
 */
const REDACT_PATHS = [
    "password",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "*.password",
    "*.token",
    "*.secret",
];

/**
 * Create a production-grade Pino logger
 *
 * - Development: Pretty-printed console output + file logging
 * - Production: JSON output or Loki transport if configured
 *
 * @param options - Optional configuration
 * @returns Configured Pino logger
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const level = options.level ?? process.env.LOG_LEVEL ?? "info";
    const serviceName = options.serviceName ?? process.env.OTEL_SERVICE_NAME ?? "auth-api";

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
    if (isDevelopment) {
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
                        environment: process.env.NODE_ENV ?? "production",
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
