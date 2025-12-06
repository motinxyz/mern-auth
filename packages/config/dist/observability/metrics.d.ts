/**
 * Prometheus Metrics with Grafana Cloud Integration
 *
 * Features:
 * - Prometheus metrics collection
 * - Remote write to Grafana Cloud
 * - Automatic push every 15 seconds
 * - Graceful degradation
 */
/**
 * Initialize metrics
 * (Now handled by OpenTelemetry SDK in tracing.js)
 */
export declare function initializeMetrics(): void;
/**
 * Get the Prometheus registry
 * @deprecated OTel manages its own registry
 */
export declare function getMetricsRegistry(): {
    contentType: string;
    metrics: () => Promise<string>;
    clear: () => void;
};
/**
 * Stop metrics collection
 */
export declare function stopMetrics(): void;
/**
 * Email Metrics
 * Track email sends, failures, and performance
 */
export declare const emailSendTotal: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
export declare const emailSendDuration: import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
export declare const emailBounceTotal: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
export declare const emailCircuitBreakerState: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
//# sourceMappingURL=metrics.d.ts.map