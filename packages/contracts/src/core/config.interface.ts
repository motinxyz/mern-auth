/**
 * @auth/contracts - Configuration Interface
 *
 * Defines the contract for environment configuration.
 * Mirrors the validated environment config from @auth/config package.
 *
 * Uses `| undefined` on optional properties for exactOptionalPropertyTypes compatibility.
 */

// =============================================================================
// Environment Configuration Interface
// =============================================================================

/**
 * Application configuration interface.
 *
 * All properties are readonly to ensure configuration immutability at runtime.
 * This interface mirrors the validated config from @auth/config.
 */
export interface IConfig {
    // =========================================================================
    // Environment
    // =========================================================================

    /** Current runtime environment */
    readonly env: "development" | "production" | "test";
    /** True if running in development mode */
    readonly isDevelopment: boolean;
    /** True if running in production mode */
    readonly isProduction: boolean;
    /** True if running in test mode */
    readonly isTest: boolean;

    // =========================================================================
    // Server
    // =========================================================================

    /** HTTP server port */
    readonly port: number;
    /** HTTP server hostname */
    readonly hostname: string;

    // =========================================================================
    // Database (MongoDB)
    // =========================================================================

    /** MongoDB connection URI */
    readonly dbURI: string;
    /** Database name */
    readonly dbName: string;
    /** Maximum retry attempts for database connection */
    readonly dbMaxRetries: number;
    /** Initial delay between retry attempts (milliseconds) */
    readonly dbInitialRetryDelayMs: number;
    /** Maximum connection pool size */
    readonly dbPoolSize: number;
    /** Minimum connection pool size */
    readonly dbMinPoolSize: number;
    /** Maximum connection pool size (alias for dbPoolSize) */
    readonly dbMaxIdleTimeMs: number;
    /** Wait queue timeout for connection (milliseconds) */
    readonly dbWaitQueueTimeoutMs: number;
    /** Server selection timeout (milliseconds) */
    readonly serverSelectionTimeoutMs: number;
    /** Socket timeout for operations (milliseconds) */
    readonly socketTimeoutMs: number;

    // =========================================================================
    // Redis
    // =========================================================================

    /** Redis connection URL */
    readonly redisUrl: string;
    /** Redis-specific configuration */
    readonly redis: {
        /** Key prefixes for namespacing */
        readonly prefixes: {
            /** Prefix for email verification tokens */
            readonly verifyEmail: string;
            /** Prefix for verification rate limiting */
            readonly verifyEmailRateLimit: string;
        };
        /** Circuit breaker timeout for Redis operations (milliseconds) */
        readonly circuitBreakerTimeout: number;
    };

    // =========================================================================
    // Email
    // =========================================================================

    /** Default sender email address */
    readonly emailFrom: string | undefined;
    /** Resend API key for email sending */
    readonly resendApiKey: string | undefined;
    /** Resend webhook secret for signature verification */
    readonly resendWebhookSecret: string | undefined;
    /** MailerSend API key for email sending */
    readonly mailersendApiKey: string | undefined;
    /** MailerSend webhook secret for signature verification */
    readonly mailersendWebhookSecret: string | undefined;
    /** MailerSend sender email address */
    readonly mailersendEmailFrom: string | undefined;
    /** Verification token expiration time (seconds) */
    readonly verificationTokenExpiresIn: number;

    // =========================================================================
    // Security
    // =========================================================================

    /** Number of bcrypt salt rounds for password hashing */
    readonly bcryptSaltRounds: number;

    // =========================================================================
    // Logging
    // =========================================================================

    /** Log level (e.g., 'debug', 'info', 'warn', 'error') */
    readonly logLevel: string;

    // =========================================================================
    // URLs
    // =========================================================================

    /** Frontend client URL for redirects and email links */
    readonly clientUrl: string;

    // =========================================================================
    // CORS
    // =========================================================================

    /** CORS configuration */
    readonly cors: {
        /** List of allowed origins */
        readonly allowedOrigins: readonly string[];
        /** Whether to allow credentials */
        readonly credentials: boolean;
    };

    // =========================================================================
    // Observability
    // =========================================================================

    /** Sentry DSN for error tracking */
    readonly sentryDsn: string | undefined;
    /** Enable Sentry in development mode */
    readonly sentryDevEnabled: boolean;
    /** Observability configuration */
    readonly observability: {
        /** Master enable/disable for observability */
        readonly enabled: boolean;
        /** Service name for tracing/metrics */
        readonly serviceName: string;
        /** Service version for tracing/metrics */
        readonly serviceVersion: string;
        /** Enable OpenTelemetry */
        readonly otelEnabled: boolean;
        /** Enable metrics collection */
        readonly metricsEnabled: boolean;
        /** Enable distributed tracing */
        readonly tracingEnabled: boolean;
        /** Grafana Cloud configuration */
        readonly grafana: {
            /** Loki (logs) configuration */
            readonly loki: {
                /** Loki endpoint URL */
                readonly url: string | undefined;
                /** Loki username */
                readonly user: string | undefined;
                /** Loki API key */
                readonly apiKey: string | undefined;
                /** Loki bearer token (alternative auth) */
                readonly bearerToken: string | undefined;
            };
            /** Tempo (traces) configuration */
            readonly tempo: {
                /** Tempo endpoint URL */
                readonly url: string | undefined;
                /** Tempo username */
                readonly user: string | undefined;
                /** Tempo API key */
                readonly apiKey: string | undefined;
            };
            /** Prometheus (metrics) configuration */
            readonly prometheus: {
                /** Prometheus endpoint URL */
                readonly url: string | undefined;
                /** Prometheus username */
                readonly user: string | undefined;
                /** Prometheus API key */
                readonly apiKey: string | undefined;
            };
        };
    };

    // =========================================================================
    // Worker
    // =========================================================================

    /** Worker-specific configuration */
    readonly worker: {
        /** Number of concurrent jobs to process */
        readonly concurrency: number;
        /** Maximum retry attempts for failed jobs */
        readonly maxRetries: number;
        /** Backoff delay between retries (milliseconds) */
        readonly backoffDelay: number;
        /** Interval for checking stalled jobs (milliseconds) */
        readonly stalledInterval: number;
        /** Disable stalled job checking (for testing) */
        readonly disableStalledJobCheck: boolean;
    };

    // =========================================================================
    // System
    // =========================================================================

    /** Graceful shutdown timeout (milliseconds) */
    readonly shutdownTimeoutMs: number;
    /** Maximum Redis reconnection attempts */
    readonly redisMaxRetries: number;
    /** Delay between Redis reconnection attempts (milliseconds) */
    readonly redisRetryDelayMs: number;
}
