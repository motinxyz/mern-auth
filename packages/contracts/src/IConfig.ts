/**
 * IConfig - Interface for environment configuration
 *
 * Mirrors the shape of the validated environment config from @auth/config
 * Uses `| undefined` on optional properties for exactOptionalPropertyTypes compatibility
 */
export interface IConfig {
    // Environment
    readonly env: "development" | "production" | "test";
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly isTest: boolean;

    // Server
    readonly port: number;
    readonly hostname: string;

    // Database
    readonly dbURI: string;
    readonly dbName: string;
    readonly dbMaxRetries: number;
    readonly dbInitialRetryDelayMs: number;
    readonly dbPoolSize: number;
    readonly dbMinPoolSize: number;
    readonly dbMaxIdleTimeMs: number;
    readonly dbWaitQueueTimeoutMs: number;
    readonly serverSelectionTimeoutMs: number;
    readonly socketTimeoutMs: number;

    // Redis
    readonly redisUrl: string;
    readonly redis: {
        readonly prefixes: {
            readonly verifyEmail: string;
            readonly verifyEmailRateLimit: string;
        };
        readonly circuitBreakerTimeout: number;
    };

    // Email
    readonly emailFrom: string | undefined;
    readonly resendApiKey: string | undefined;
    readonly resendWebhookSecret: string | undefined;
    readonly mailersendApiKey: string | undefined;
    readonly mailersendWebhookSecret: string | undefined;
    readonly mailersendEmailFrom: string | undefined;
    readonly verificationTokenExpiresIn: number;

    // Security
    readonly bcryptSaltRounds: number;

    // Logging
    readonly logLevel: string;

    // URLs
    readonly clientUrl: string;

    // CORS
    readonly cors: {
        readonly allowedOrigins: readonly string[];
        readonly credentials: boolean;
    };

    // Observability
    readonly sentryDsn: string | undefined;
    readonly sentryDevEnabled: boolean;
    readonly observability: {
        readonly enabled: boolean;
        readonly serviceName: string;
        readonly serviceVersion: string;
        readonly otelEnabled: boolean;
        readonly metricsEnabled: boolean;
        readonly tracingEnabled: boolean;
        readonly grafana: {
            readonly loki: {
                readonly url: string | undefined;
                readonly user: string | undefined;
                readonly apiKey: string | undefined;
                readonly bearerToken: string | undefined;
            };
            readonly tempo: {
                readonly url: string | undefined;
                readonly user: string | undefined;
                readonly apiKey: string | undefined;
            };
            readonly prometheus: {
                readonly url: string | undefined;
                readonly user: string | undefined;
                readonly apiKey: string | undefined;
            };
        };
    };

    // Worker
    readonly worker: {
        readonly concurrency: number;
        readonly maxRetries: number;
        readonly backoffDelay: number;
        readonly stalledInterval: number;
        readonly disableStalledJobCheck: boolean;
    };

    // System
    readonly shutdownTimeoutMs: number;
    readonly redisMaxRetries: number;
    readonly redisRetryDelayMs: number;
}
