/**
 * IConfig - Interface for environment configuration
 * 
 * Mirrors the shape of the validated environment config
 */
export interface IConfig {
    // Server
    nodeEnv: "development" | "production" | "test";
    port: number;
    apiVersion: string;
    serviceName: string;

    // Database
    mongoUri: string;
    dbURI?: string;
    dbName?: string;
    dbMaxRetries?: number;
    dbInitialRetryDelayMs?: number;
    dbPoolSize?: number;
    dbMinPoolSize?: number;
    dbMaxIdleTimeMs?: number;
    dbWaitQueueTimeoutMs?: number;
    serverSelectionTimeoutMs?: number;
    socketTimeoutMs?: number;

    // Redis
    redisUrl: string;
    redis: {
        circuitBreakerTimeout: number;
        prefixes: {
            verifyEmailRateLimit: string;
            verifyEmail: string;
        };
    };

    // JWT
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    verificationTokenExpiresIn: number;

    // Email Providers
    resendApiKey?: string;
    resendWebhookSecret?: string;
    mailersendApiKey?: string;
    mailersendWebhookSecret?: string;
    fromEmail: string;

    // URLs
    frontendUrl: string;

    // Feature Flags
    enableEmailVerification: boolean;

    // Observability
    sentryDsn?: string;
    tempoOtlpUrl?: string;
    tempoAuthHeader?: string;

    // CORS
    corsOrigins: string[];
}
