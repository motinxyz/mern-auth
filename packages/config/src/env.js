import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { EnvironmentError } from "@auth/utils";
import { z } from "zod";
import { DEFAULTS, urlRegex, Environments } from "./env.constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findMonorepoRoot(startDir) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new EnvironmentError("Could not find monorepo root.");
}

let root = findMonorepoRoot(__dirname);
if (process.env.NODE_ENV === "test") {
  // In test mode, don't override env vars set by globalSetup (test containers)
  // This allows MONGO_URI and REDIS_URL from globalSetup to take precedence
  dotenv.config({ path: path.resolve(root, ".env.test"), override: false });
} else {
  dotenv.config({ path: path.resolve(root, ".env") });
}

const envSchema = z.object({
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
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
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

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new EnvironmentError(parsedEnv.error.issues);
}

const envVars = parsedEnv.data;

const envConfigPath = path.resolve(
  root,
  `packages/config/src/config/${envVars.NODE_ENV}.js`
);

let envConfig = {};
try {
  envConfig = await import(envConfigPath);
} catch (error) {
  console.warn(
    `No environment-specific configuration found for ${envVars.NODE_ENV}.`
  );
}

const finalConfig = {
  env: envVars.NODE_ENV,
  isDevelopment: envVars.NODE_ENV === "development",
  port: envVars.PORT,
  dbURI: envVars.MONGO_URI,
  dbName: envVars.DB_NAME,
  clientUrl: envVars.CLIENT_URL,

  // CORS Configuration - centralized for all packages
  cors: {
    allowedOrigins: [
      envVars.CLIENT_URL,
      // Development origins (only in non-production)
      ...(envVars.NODE_ENV !== "production"
        ? ["http://localhost:5173", "http://localhost:5174"]
        : []),
    ],
    credentials: true,
  },

  redisUrl: envVars.REDIS_URL,
  redis: {
    prefixes: {
      verifyEmail: envVars.REDIS_PREFIX_VERIFY_EMAIL,
      verifyEmailRateLimit: envVars.REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT,
    },
  },
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
  resendApiKey: envVars.RESEND_API_KEY,
  resendWebhookSecret: envVars.RESEND_WEBHOOK_SECRET,
  sentryDsn: envVars.SENTRY_DSN,
  emailFrom: envVars.EMAIL_FROM,
  verificationTokenExpiresIn: envVars.VERIFICATION_TOKEN_EXPIRES_IN,
  logLevel: envVars.NODE_ENV === "development" ? "info" : envVars.LOG_LEVEL,
  bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
  dbMaxRetries: envVars.DB_MAX_RETRIES,
  dbInitialRetryDelayMs: envVars.DB_INITIAL_RETRY_DELAY_MS,
  shutdownTimeoutMs: envVars.SHUTDOWN_TIMEOUT_MS,
  redisMaxRetries: envVars.REDIS_MAX_RETRIES,
  redisRetryDelayMs: envVars.REDIS_RETRY_DELAY_MS,

  // MongoDB Connection Pool Configuration
  dbPoolSize: envVars.DB_POOL_SIZE,
  dbMinPoolSize: envVars.DB_MIN_POOL_SIZE,
  dbMaxIdleTimeMs: envVars.DB_MAX_IDLE_TIME_MS,
  dbWaitQueueTimeoutMs: envVars.DB_WAIT_QUEUE_TIMEOUT_MS,
  serverSelectionTimeoutMs: envVars.DB_SERVER_SELECTION_TIMEOUT_MS,
  socketTimeoutMs: envVars.DB_SOCKET_TIMEOUT_MS,

  // Worker Configuration
  worker: {
    concurrency: envVars.WORKER_CONCURRENCY,
    maxRetries: envVars.WORKER_MAX_RETRIES,
    backoffDelay: envVars.WORKER_BACKOFF_DELAY_MS,
    stalledInterval: envVars.WORKER_STALLED_INTERVAL_MS,
    disableStalledJobCheck: envVars.DISABLE_STALLED_JOB_CHECK === "true",
  },

  // Observability Config
  observability: {
    enabled: envVars.OBSERVABILITY_ENABLED === "true",
    serviceName: envVars.OTEL_SERVICE_NAME,
    serviceVersion: envVars.OTEL_SERVICE_VERSION,
    otelEnabled: envVars.OTEL_ENABLED === "true",
    metricsEnabled: envVars.METRICS_ENABLED === "true",
    tracingEnabled: envVars.TRACING_ENABLED === "true",
    grafana: {
      loki: {
        url: envVars.GRAFANA_LOKI_URL,
        user: envVars.GRAFANA_LOKI_USER,
        apiKey: envVars.GRAFANA_LOKI_API_KEY || envVars.GRAFANA_LOKI_API,
        bearerToken: envVars.GRAFANA_LOKI_BEARER_TOKEN,
      },
      tempo: {
        url: envVars.GRAFANA_TEMPO_URL,
        user: envVars.GRAFANA_TEMPO_USER,
        apiKey: envVars.GRAFANA_TEMPO_API_KEY,
      },
      prometheus: {
        url: envVars.GRAFANA_PROMETHEUS_URL,
        user: envVars.GRAFANA_PROMETHEUS_USER,
        apiKey: envVars.GRAFANA_PROMETHEUS_API_KEY,
      },
    },
  },
  ...envConfig.default,
};

Object.freeze(finalConfig);

export default finalConfig;
