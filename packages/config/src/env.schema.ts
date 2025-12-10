/**
 * Environment Variables Schema
 * Zod validation schema for all environment variables
 */
import { z } from "zod";
import { DEFAULTS, urlRegex, Environments } from "./env.constants.js";

/**
 * Configuration schema for environment variable validation
 */
export const configSchema = z.object({
    NODE_ENV: z
        .enum([
            Environments.DEVELOPMENT,
            Environments.PRODUCTION,
            Environments.TEST,
        ])
        .default(DEFAULTS.NODE_ENV),
    PORT: z.coerce.number().default(DEFAULTS.PORT),
    MONGO_URI: z
        .string()
        .min(1, { message: "MONGO_URI is required" })
        .refine(
            (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
            { message: "MONGO_URI must start with mongodb:// or mongodb+srv://" }
        ),
    DB_NAME: z.string().min(1).default(DEFAULTS.DB_NAME),
    CLIENT_URL: z
        .string()
        .default(DEFAULTS.CLIENT_URL)
        .refine((val) => urlRegex.test(val), {
            message: "CLIENT_URL must be a valid URL",
        }),
    REDIS_URL: z
        .string()
        .trim()
        .refine((val) => urlRegex.test(val), {
            message: "REDIS_URL must be a valid URL",
        }),

    RESEND_API_KEY: z.string().optional(),
    MAILERSEND_API_KEY: z.string().optional(),
    MAILERSEND_EMAIL_FROM: z.string().optional(),
    MAILERSEND_WEBHOOK_SECRET: z.string().optional(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),

    EMAIL_FROM: z
        .string()
        .refine(
            (val) => {
                // Support both formats:
                // 1. Simple: "support@example.com"
                // 2. Professional: "DevsDaily <support@example.com>"
                const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const professionalEmailRegex = /^.+\s*<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
                return simpleEmailRegex.test(val) || professionalEmailRegex.test(val);
            },
            {
                message:
                    "EMAIL_FROM must be a valid email or 'Name <email@example.com>' format",
            }
        )
        .optional(),
    VERIFICATION_TOKEN_EXPIRES_IN: z.coerce
        .number()
        .default(DEFAULTS.VERIFICATION_TOKEN_EXPIRES_IN),
    LOG_LEVEL: z.string().default(DEFAULTS.LOG_LEVEL),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(DEFAULTS.BCRYPT_SALT_ROUNDS),
    DB_MAX_RETRIES: z.coerce.number().default(DEFAULTS.DB_MAX_RETRIES),
    DB_INITIAL_RETRY_DELAY_MS: z.coerce
        .number()
        .default(DEFAULTS.DB_INITIAL_RETRY_DELAY_MS),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().default(DEFAULTS.SHUTDOWN_TIMEOUT_MS),
    REDIS_MAX_RETRIES: z.coerce.number().default(DEFAULTS.REDIS_MAX_RETRIES),
    REDIS_RETRY_DELAY_MS: z.coerce
        .number()
        .default(DEFAULTS.REDIS_RETRY_DELAY_MS),
    REDIS_PREFIX_VERIFY_EMAIL: z
        .string()
        .default(DEFAULTS.REDIS_PREFIX_VERIFY_EMAIL),
    REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT: z
        .string()
        .default(DEFAULTS.REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT),

    // MongoDB Connection Pool Configuration
    DB_POOL_SIZE: z.coerce.number().default(DEFAULTS.DB_POOL_SIZE),
    DB_MIN_POOL_SIZE: z.coerce.number().default(DEFAULTS.DB_MIN_POOL_SIZE),
    DB_MAX_IDLE_TIME_MS: z.coerce.number().default(DEFAULTS.DB_MAX_IDLE_TIME_MS),
    DB_WAIT_QUEUE_TIMEOUT_MS: z.coerce
        .number()
        .default(DEFAULTS.DB_WAIT_QUEUE_TIMEOUT_MS),
    DB_SERVER_SELECTION_TIMEOUT_MS: z.coerce
        .number()
        .default(DEFAULTS.DB_SERVER_SELECTION_TIMEOUT_MS),
    DB_SOCKET_TIMEOUT_MS: z.coerce
        .number()
        .default(DEFAULTS.DB_SOCKET_TIMEOUT_MS),

    // Worker Configuration
    WORKER_CONCURRENCY: z.coerce.number().default(DEFAULTS.WORKER_CONCURRENCY),
    WORKER_MAX_RETRIES: z.coerce.number().default(DEFAULTS.WORKER_MAX_RETRIES),
    WORKER_BACKOFF_DELAY_MS: z.coerce
        .number()
        .default(DEFAULTS.WORKER_BACKOFF_DELAY_MS),
    WORKER_STALLED_INTERVAL_MS: z.coerce
        .number()
        .default(DEFAULTS.WORKER_STALLED_INTERVAL_MS),
    DISABLE_STALLED_JOB_CHECK: z.string().default("false"),

    // Observability
    OBSERVABILITY_ENABLED: z.string().default("false"),
    OTEL_SERVICE_NAME: z.string().default("auth-api"),
    OTEL_SERVICE_VERSION: z.string().default("1.0.0"),
    OTEL_ENABLED: z.string().default("false"),
    METRICS_ENABLED: z.string().default("false"),
    TRACING_ENABLED: z.string().default("false"),

    // System
    HOSTNAME: z.string().default(DEFAULTS.HOSTNAME),
    REDIS_CIRCUIT_BREAKER_TIMEOUT: z.coerce
        .number()
        .default(DEFAULTS.REDIS_CIRCUIT_BREAKER_TIMEOUT),
    SENTRY_DEV_ENABLED: z.string().default(DEFAULTS.SENTRY_DEV_ENABLED),

    // Grafana Cloud
    GRAFANA_LOKI_URL: z.string().optional(),
    GRAFANA_LOKI_USER: z.string().optional(),
    GRAFANA_LOKI_API_KEY: z.string().optional(),
    GRAFANA_LOKI_BEARER_TOKEN: z.string().optional(),

    GRAFANA_TEMPO_URL: z.string().optional(),
    GRAFANA_TEMPO_USER: z.string().optional(),
    GRAFANA_TEMPO_API_KEY: z.string().optional(),

    GRAFANA_PROMETHEUS_URL: z.string().optional(),
    GRAFANA_PROMETHEUS_USER: z.string().optional(),
    GRAFANA_PROMETHEUS_API_KEY: z.string().optional(),
    GRAFANA_LOKI_API: z.string().optional(), // Fallback for API_KEY
});

/**
 * Inferred type from the schema for type-safe access
 */
export type ConfigSchema = z.infer<typeof configSchema>;
