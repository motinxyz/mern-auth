/**
 * Observability Configuration
 * Centralized configuration for all observability features
 */
import config from "../env.js";
export const observabilityConfig = {
    enabled: config.observability.enabled,
    // Loki (Logs)
    loki: {
        enabled: !!config.observability.grafana.loki.url,
        url: config.observability.grafana.loki.url,
        user: config.observability.grafana.loki.user,
        apiKey: config.observability.grafana.loki.apiKey,
        bearerToken: config.observability.grafana.loki.bearerToken,
        labels: {
            app: config.observability.serviceName,
            environment: config.env,
            version: config.observability.serviceVersion,
        },
    },
    // Prometheus (Metrics)
    prometheus: {
        enabled: config.observability.metricsEnabled,
        remoteWrite: {
            enabled: !!config.observability.grafana.prometheus.url,
            url: config.observability.grafana.prometheus.url,
            username: config.observability.grafana.prometheus.user,
            password: config.observability.grafana.prometheus.apiKey,
        },
    },
    // OpenTelemetry (Traces)
    tracing: {
        enabled: config.observability.otelEnabled,
        serviceName: config.observability.serviceName,
        serviceVersion: config.observability.serviceVersion,
        environment: config.env,
        hostname: config.hostname,
        tempo: {
            url: config.observability.grafana.tempo.url?.startsWith("http")
                ? config.observability.grafana.tempo.url
                : `https://${config.observability.grafana.tempo.url}`,
            headers: config.observability.grafana.tempo.user &&
                config.observability.grafana.tempo.apiKey
                ? {
                    Authorization: `Basic ${Buffer.from(`${config.observability.grafana.tempo.user}:${config.observability.grafana.tempo.apiKey}`).toString("base64")}`,
                }
                : {},
        },
    },
};
export function isObservabilityEnabled() {
    return observabilityConfig.enabled;
}
export function isLokiEnabled() {
    return observabilityConfig.loki.enabled;
}
export function isMetricsEnabled() {
    return observabilityConfig.prometheus.enabled;
}
export function isTracingEnabled() {
    return observabilityConfig.tracing.enabled;
}
//# sourceMappingURL=config.js.map