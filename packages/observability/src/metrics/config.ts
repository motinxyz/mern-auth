import { config } from "@auth/config";

export interface MetricsConfig {
    enabled: boolean;
    remoteWrite: {
        enabled: boolean;
        url: string | undefined;
        username: string | undefined;
        password: string | undefined;
    };
}

const metricsSettings = config?.observability?.grafana?.prometheus ?? {
    url: undefined,
    user: undefined,
    apiKey: undefined,
};

export const metricsConfig: MetricsConfig = {
    enabled: config?.observability?.metricsEnabled ?? false,
    remoteWrite: {
        enabled: metricsSettings.url !== undefined && metricsSettings.url !== "",
        url: metricsSettings.url,
        username: metricsSettings.user,
        password: metricsSettings.apiKey,
    },
};

export function isMetricsEnabled(): boolean {
    return metricsConfig.enabled;
}
