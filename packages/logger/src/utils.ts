import { type LokiConfig, type LogConfig } from "./types/index.js";

/**
 * Get environment-specific configuration
 * Reads directly from process.env to avoid circular dependencies with @auth/config
 */
export function getLogConfig(): LogConfig {
    return {
        isDevelopment: process.env.NODE_ENV !== "production",
        level: process.env.LOG_LEVEL,
        serviceName: process.env.OTEL_SERVICE_NAME ?? "devs-daily",
        environment: process.env.NODE_ENV ?? "production",
    };
}

/**
 * Get Loki configuration from environment
 */
export function getLokiConfig(): LokiConfig | null {
    const url = process.env.GRAFANA_LOKI_URL;
    const user = process.env.GRAFANA_LOKI_USER;
    const apiKey = process.env.GRAFANA_LOKI_API_KEY;

    if (url && user && apiKey) {
        return { url, user, apiKey };
    }
    return null;
}
