/**
 * Observability Configuration
 * Centralized configuration for all observability features
 *
 * NOTE: This module imports from @auth/config for environment configuration.
 */

import { config } from "@auth/config";

// try {
//     // eslint-disable-next-line no-console
//     console.log("Observability Config Loaded. Config keys:", Object.keys(config));
// } catch (e) {
//     console.error("Error logging config keys", e);
// }

interface TempoHeaders {
    Authorization?: string;
}

interface ObservabilityConfig {
    enabled: boolean;
    loki: {
        enabled: boolean;
        url: string | undefined;
        user: string | undefined;
        apiKey: string | undefined;
        labels: {
            app: string;
            environment: string;
            version: string;
        };
    };
    prometheus: {
        enabled: boolean;
        remoteWrite: {
            enabled: boolean;
            url: string | undefined;
            username: string | undefined;
            password: string | undefined;
        };
    };
    tracing: {
        enabled: boolean;
        serviceName: string;
        serviceVersion: string;
        environment: string;
        hostname: string;
        tempo: {
            url: string;
            headers: TempoHeaders;
        };
    };
    sentry: {
        enabled: boolean;
        dsn: string | undefined;
        environment: string;
        release: string;
    };
}

const observabilitySettings = config?.observability ?? {
    enabled: false,
    grafana: {
        loki: { url: undefined, user: undefined, apiKey: undefined },
        prometheus: { url: undefined, user: undefined, apiKey: undefined },
        tempo: { url: undefined, user: undefined, apiKey: undefined },
    },
    metricsEnabled: false,
    otelEnabled: false,
    serviceName: "unknown",
    serviceVersion: "0.0.0",
};

export const observabilityConfig: ObservabilityConfig = {
    enabled: observabilitySettings.enabled,

    // Loki (Logs)
    loki: {
        enabled: observabilitySettings.grafana.loki.url !== undefined && observabilitySettings.grafana.loki.url !== "",
        url: observabilitySettings.grafana.loki.url,
        user: observabilitySettings.grafana.loki.user,
        apiKey: observabilitySettings.grafana.loki.apiKey,
        labels: {
            app: observabilitySettings.serviceName,
            environment: config?.env ?? "development",
            version: observabilitySettings.serviceVersion,
        },
    },

    // Prometheus (Metrics)
    prometheus: {
        enabled: observabilitySettings.metricsEnabled,
        remoteWrite: {
            enabled: observabilitySettings.grafana.prometheus.url !== undefined && observabilitySettings.grafana.prometheus.url !== "",
            url: observabilitySettings.grafana.prometheus.url,
            username: observabilitySettings.grafana.prometheus.user,
            password: observabilitySettings.grafana.prometheus.apiKey,
        },
    },

    // OpenTelemetry (Traces)
    tracing: {
        enabled: observabilitySettings.otelEnabled,
        serviceName: observabilitySettings.serviceName,
        serviceVersion: observabilitySettings.serviceVersion,
        environment: config?.env ?? "development",
        hostname: config?.hostname ?? "localhost",
        tempo: {
            url: ((): string => {
                const tempoUrl = observabilitySettings.grafana.tempo.url;
                if (typeof tempoUrl === "string" && tempoUrl.startsWith("http")) {
                    return tempoUrl;
                }
                return `https://${tempoUrl ?? ""}`;
            })(),
            headers: ((): TempoHeaders => {
                const user = observabilitySettings.grafana.tempo.user;
                const apiKey = observabilitySettings.grafana.tempo.apiKey;
                if (user !== undefined && user !== "" && apiKey !== undefined && apiKey !== "") {
                    return {
                        Authorization: `Basic ${Buffer.from(`${user}:${apiKey}`).toString("base64")}`,
                    };
                }
                return {};
            })(),
        },
    },

    // Sentry config
    sentry: {
        enabled: config.sentryDsn !== undefined && (config.env === "production" || config.sentryDevEnabled),
        dsn: config.sentryDsn,
        environment: config.env,
        release: observabilitySettings.serviceVersion,
    },
};

export function isObservabilityEnabled(): boolean {
    return observabilityConfig.enabled;
}

export function isLokiEnabled(): boolean {
    return observabilityConfig.loki.enabled;
}

export function isMetricsEnabled(): boolean {
    return observabilityConfig.prometheus.enabled;
}

export function isTracingEnabled(): boolean {
    return observabilityConfig.tracing.enabled;
}

export function isSentryEnabled(): boolean {
    return observabilityConfig.sentry.enabled;
}
