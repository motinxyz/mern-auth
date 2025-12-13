import { config } from "@auth/config";

interface TempoHeaders {
    Authorization?: string;
}

export interface TracingConfig {
    enabled: boolean;
    serviceName: string;
    serviceVersion: string;
    environment: string;
    hostname: string;
    tempo: {
        url: string;
        headers: TempoHeaders;
    };
}

const tracingSettings = config?.observability ?? {
    otelEnabled: false,
    serviceName: "unknown",
    serviceVersion: "0.0.0",
    grafana: { tempo: { url: undefined, user: undefined, apiKey: undefined } },
};

export const tracingConfig: TracingConfig = {
    enabled: tracingSettings.otelEnabled ?? false,
    serviceName: tracingSettings.serviceName ?? "unknown",
    serviceVersion: tracingSettings.serviceVersion ?? "0.0.0",
    environment: config?.env ?? "development",
    hostname: config?.hostname ?? "localhost",
    tempo: {
        url: ((): string => {
            const tempoUrl = tracingSettings.grafana?.tempo?.url;
            if (typeof tempoUrl === "string" && tempoUrl.startsWith("http")) {
                return tempoUrl;
            }
            return `https://${tempoUrl ?? ""}`;
        })(),
        headers: ((): TempoHeaders => {
            const user = tracingSettings.grafana?.tempo?.user;
            const apiKey = tracingSettings.grafana?.tempo?.apiKey;
            if (
                user !== undefined &&
                user !== "" &&
                apiKey !== undefined &&
                apiKey !== ""
            ) {
                return {
                    Authorization: `Basic ${Buffer.from(`${user}:${apiKey}`).toString("base64")}`,
                };
            }
            return {};
        })(),
    },
};

export function isTracingEnabled(): boolean {
    return tracingConfig.enabled;
}
