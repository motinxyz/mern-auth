/**
 * Prometheus Metrics with Grafana Cloud Integration
 *
 * Features:
 * - Prometheus metrics collection
 * - Remote write to Grafana Cloud
 * - Automatic push every 15 seconds
 * - Graceful degradation
 */
import { metrics } from "@opentelemetry/api";
import { isMetricsEnabled } from "./config.js";
import { createModuleLogger } from "../logging/startup-logger.js";
const log = createModuleLogger("metrics");
const meter = metrics.getMeter("auth-config-metrics");
/**
 * Initialize metrics
 * (Now handled by OpenTelemetry SDK in tracing.js)
 */
export const initializeMetrics = () => {
    const metricsEnabled = isMetricsEnabled();
    if (metricsEnabled !== true) {
        log.info("Metrics disabled");
        return;
    }
    log.info("Metrics enabled (OpenTelemetry)");
};
/**
 * Get the Prometheus registry
 * @deprecated OTel manages its own registry
 */
export function getMetricsRegistry() {
    return {
        contentType: "text/plain",
        metrics: async () => "# Metrics are exported via OTLP",
        clear: () => { },
    };
}
/**
 * Stop metrics collection
 */
export function stopMetrics() {
    // No-op for OTel
}
/**
 * Email Metrics
 * Track email sends, failures, and performance
 */
// Total emails sent by type, provider, and status
export const emailSendTotal = meter.createCounter("email_send_total", {
    description: "Total number of emails sent",
});
// Email send duration by type and provider
export const emailSendDuration = meter.createHistogram("email_send_duration_seconds", {
    description: "Email send duration in seconds",
    unit: "s",
});
// Email bounces by type and bounce type
export const emailBounceTotal = meter.createCounter("email_bounce_total", {
    description: "Total number of email bounces",
});
// Circuit breaker state for email service
export const emailCircuitBreakerState = meter.createCounter("email_circuit_breaker_events_total", {
    description: "Email circuit breaker state changes",
});
//# sourceMappingURL=metrics.js.map