/**
 * @auth/observability
 *
 * Dedicated observability package for the auth monorepo.
 *
 * Features:
 * - Logs: Pino → Grafana Cloud Loki
 * - Metrics: OpenTelemetry → Grafana Cloud Prometheus
 * - Traces: OpenTelemetry → Grafana Cloud Tempo
 *
 * Usage:
 * ```typescript
 * import { initializeTracing, initializeMetrics, createObservabilityLogger } from "@auth/observability";
 *
 * // Initialize at the very start of your app
 * initializeTracing();
 * initializeMetrics();
 *
 * // Create logger with trace context
 * const logger = createObservabilityLogger();
 * ```
 */

// Core Configuration
// Export domain configs
export * from "./tracing/config.js";
export * from "./sentry/config.js";
export * from "./metrics/config.js";
export * from "./logger.js";

// Tracing (OpenTelemetry)
export * from "./tracing/index.js";

// Metrics (Prometheus)
export * from "./metrics/index.js";

// Error Tracking (Sentry)
export * from "./sentry/index.js";

// Tracing Utilities
export {
    withSpan,
    addSpanAttributes,
    recordError,
    getTraceContext,
    createSpanLink,
    addSpanEvent,
    type WithSpanOptions,
    type TraceContext,
} from "./tracing/utils.js";

// Logging - with trace context
export {
    createObservabilityLogger,
    getObservabilityLogger,
    getLoggerWithTrace,
    type Logger,
    type CreateLoggerOptions,
} from "./logger.js";


