import { config } from "@auth/config";

export interface SentryConfig {
    enabled: boolean;
    dsn: string | undefined;
    environment: string;
    release: string;
}


export const sentryConfig: SentryConfig = {
    enabled:
        config.sentryDsn !== undefined &&
        (config.env === "production" || config.sentryDevEnabled),
    dsn: config.sentryDsn,
    environment: config.env,
    release: config.observability?.serviceVersion ?? "0.0.0",
};

export function isSentryEnabled(): boolean {
    return sentryConfig.enabled;
}
