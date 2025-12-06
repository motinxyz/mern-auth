/**
 * Observability Module
 *
 * Production-grade hybrid observability stack:
 * - Logs: Pino → Grafana Cloud Loki
 * - Metrics: Prometheus → Grafana Cloud
 * - Traces: OpenTelemetry → Grafana Cloud Tempo
 * - Errors: Sentry
 *
 * Features:
 * - Graceful degradation (works without cloud)
 * - Environment-based configuration
 * - Automatic instrumentation
 * - Correlation between logs/metrics/traces
 */
export { getObservabilityLogger, getLoggerWithTrace } from "./logger.js";
export { initializeMetrics, getMetricsRegistry, emailSendTotal, emailSendDuration, emailBounceTotal, emailCircuitBreakerState, stopMetrics, } from "./metrics.js";
export { initializeTracing, shutdownTracing, getTracingSDK, } from "./tracing.js";
export { isObservabilityEnabled, isLokiEnabled } from "./config.js";
//# sourceMappingURL=index.d.ts.map