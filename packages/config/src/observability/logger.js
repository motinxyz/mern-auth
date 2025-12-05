/**
 * Logger with Grafana Agent Integration
 *
 * Features:
 * - Structured logging with Pino
 * - Clean JSON output for Grafana Agent collection
 * - Pretty printing in development
 * - File rotation support for production
 * - Trace ID correlation
 */

import pino from "pino";
import config from "../env.js";
import { trace } from "@opentelemetry/api";

/**
 * Create logger optimized for Grafana Agent collection
 *
 * In development: Pretty-printed console output
 * In production: JSON logs to stdout (collected by Grafana Agent)
 */
export function getObservabilityLogger(options = {}) {
  const baseConfig = {
    level: config.logLevel || "info",
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Mixin: Automatically inject trace context from OpenTelemetry
    mixin() {
      const span = trace.getActiveSpan();
      const spanContext = span?.spanContext();

      if (spanContext) {
        return {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          traceFlags: spanContext.traceFlags,
        };
      }
      return {};
    },
    ...options,
  };

  // Development: Pretty printing for readability + File logging
  if (config.env === "development") {
    const devConfig = { ...baseConfig };
    delete devConfig.formatters; // Transports don't support custom level formatters in the main config

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

  // Production: Clean JSON to stdout for Grafana Agent
  // Grafana Agent will tail stdout and ship to Loki
  return pino(baseConfig);
}

/**
 * Get logger with trace context
 * Automatically includes trace ID if available
 */
export function getLoggerWithTrace(traceId, options = {}) {
  const logger = getObservabilityLogger(options);

  if (traceId) {
    return logger.child({ traceId });
  }

  return logger;
}
