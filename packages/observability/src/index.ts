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

// Configuration
export {
    observabilityConfig,
    isObservabilityEnabled,
    isLokiEnabled,
    isMetricsEnabled,
    isTracingEnabled,
} from "./config.js";

// Tracing
export {
    initializeTracing,
    shutdownTracing,
    getTracingSDK,
} from "./tracing.js";

// Metrics
export {
    initializeMetrics,
    getMetricsRegistry,
    stopMetrics,
    emailSendTotal,
    emailSendDuration,
    emailBounceTotal,
    emailCircuitBreakerState,
} from "./metrics.js";

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
} from "./utils/tracing.js";

// Logging - with trace context
export {
    createObservabilityLogger,
    getObservabilityLogger,
    getLoggerWithTrace,
    type Logger,
    type CreateLoggerOptions,
} from "./logger.js";


