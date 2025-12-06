/**
 * IConfig - Interface for environment configuration
 *
 * Mirrors the shape of the validated environment config
 */
export interface IConfig {
    nodeEnv: "development" | "production" | "test";
    port: number;
    apiVersion: string;
    serviceName: string;
    mongoUri: string;
    redisUrl: string;
    redis: {
        circuitBreakerTimeout: number;
        prefixes: {
            verifyEmailRateLimit: string;
            verifyEmail: string;
        };
    };
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    verificationTokenExpiresIn: number;
    resendApiKey?: string;
    resendWebhookSecret?: string;
    mailersendApiKey?: string;
    mailersendWebhookSecret?: string;
    fromEmail: string;
    frontendUrl: string;
    enableEmailVerification: boolean;
    sentryDsn?: string;
    tempoOtlpUrl?: string;
    tempoAuthHeader?: string;
    corsOrigins: string[];
}
//# sourceMappingURL=IConfig.d.ts.map