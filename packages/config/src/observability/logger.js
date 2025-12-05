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

// Force IPv4 preference for all network connections
// This fixes ETIMEDOUT errors when shipping to Grafana Cloud from environments that prefer IPv6
import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  // Ignore error if specific node version doesn't support this (though v18+ does)
}

/**
 * Create logger optimized for Grafana Agent collection
 *
 * In development: Pretty-printed console output
 * In production: pino-loki transport to ship logs directly to Grafana Cloud
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

  // Production: Ship to Loki directly
  // This replaces the experimental custom shipper service
  if (
    config.observability.grafana.loki.url &&
    config.observability.grafana.loki.user
  ) {
    return pino({
      ...baseConfig,
      transport: {
        target: "pino-loki",
        options: {
          batching: true,
          interval: 5, // Ship every 5 seconds
          host: config.observability.grafana.loki.url.replace(/\/$/, ""), // Ensure no trailing slash
          basicAuth: {
            username: config.observability.grafana.loki.user,
            password: config.observability.grafana.loki.apiKey,
          },
          labels: {
            app: config.observability.serviceName || "auth-api",
            environment: config.env,
          },
        },
      },
    });
  }

  // Fallback: Stdout if Loki not configured
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
