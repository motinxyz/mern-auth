/**
 * Observability Configuration
 * Centralized configuration for all observability features
 */

import config from "../env.js";

interface TempoHeaders {
  Authorization?: string;
}

export const observabilityConfig = {
  enabled: config.observability.enabled,

  // Loki (Logs)
  loki: {
    enabled: config.observability.grafana.loki.url !== undefined && config.observability.grafana.loki.url !== "",
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
      enabled: config.observability.grafana.prometheus.url !== undefined && config.observability.grafana.prometheus.url !== "",
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
      url: ((): string => {
        const tempoUrl = config.observability.grafana.tempo.url;
        if (typeof tempoUrl === "string" && tempoUrl.startsWith("http")) {
          return tempoUrl;
        }
        return `https://${tempoUrl ?? ""}`;
      })(),
      headers: ((): TempoHeaders => {
        const user = config.observability.grafana.tempo.user;
        const apiKey = config.observability.grafana.tempo.apiKey;
        if (user !== undefined && user !== "" && apiKey !== undefined && apiKey !== "") {
          return {
            Authorization: `Basic ${Buffer.from(`${user}:${apiKey}`).toString("base64")}`,
          };
        }
        return {};
      })(),
    },
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
