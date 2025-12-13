/**
 * Prometheus Metrics with Grafana Cloud Integration
 *
 * Features:
 * - Prometheus metrics collection
 * - Remote write to Grafana Cloud
 * - Graceful degradation
 */

import { metrics } from "@opentelemetry/api";
import { isMetricsEnabled } from "./config.js";
import { observabilityLogger } from "../logging/internal.js";

const log = observabilityLogger;

export const meter = metrics.getMeter("auth-observability-metrics");

/**
 * Initialize metrics
 * (Now handled by OpenTelemetry SDK in tracing.js)
 */
export const initializeMetrics = (): void => {
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
