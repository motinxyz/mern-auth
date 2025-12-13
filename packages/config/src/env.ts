import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { CONFIG_ERRORS } from "./constants/config.messages.js";
import { EnvironmentError } from "@auth/utils";
import { configSchema } from "./env.schema.js";
import type { Environments } from "./env.constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findMonorepoRoot(startDir: string) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new EnvironmentError(CONFIG_ERRORS.MONOREPO_ROOT_NOT_FOUND, ["pnpm-workspace.yaml"]);
}

const root = findMonorepoRoot(__dirname);
if (process.env.NODE_ENV === "test") {
  // In test mode, don't override env vars set by globalSetup (test containers)
  // This allows MONGO_URI and REDIS_URL from globalSetup to take precedence
  dotenv.config({ path: path.resolve(root, ".env.test"), override: false });
} else {
  dotenv.config({ path: path.resolve(root, ".env") });
}

const parsedEnv = configSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missingVars = parsedEnv.error.issues.map(
    (issue) => issue.path.join(".")
  );
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new EnvironmentError(
    `Environment validation failed: ${message}`,
    missingVars
  );
}

const envVars = parsedEnv.data;

const envConfigPath = path.resolve(
  root,
  `packages/config/src/config/${envVars.NODE_ENV}.js`
);

// Import createLogger from @auth/logger directly
import { createLogger } from "@auth/logger";

let envConfig: { default?: Record<string, unknown> } = {};
try {
  envConfig = await import(envConfigPath);
} catch {
  // Environment-specific config is optional
  const logger = createLogger({ serviceName: "auth-config" });
  logger.debug("No environment-specific config found, skipping.");
}

const finalConfig = {
  env: envVars.NODE_ENV as Environments,
  isDevelopment: envVars.NODE_ENV === "development",
  isProduction: envVars.NODE_ENV === "production",
  isTest: envVars.NODE_ENV === "test",
  port: envVars.PORT,
  hostname: envVars.HOSTNAME,
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
    circuitBreakerTimeout: envVars.REDIS_CIRCUIT_BREAKER_TIMEOUT,
  },
  resendApiKey: envVars.RESEND_API_KEY,
  resendWebhookSecret: envVars.RESEND_WEBHOOK_SECRET,
  mailersendApiKey: envVars.MAILERSEND_API_KEY,
  mailersendWebhookSecret: envVars.MAILERSEND_WEBHOOK_SECRET,
  // Allow overriding "From" address for MailerSend (if using specific subdomain)
  mailersendEmailFrom: envVars.MAILERSEND_EMAIL_FROM ?? envVars.EMAIL_FROM,
  sentryDsn: envVars.SENTRY_DSN,
  sentryDevEnabled: envVars.SENTRY_DEV_ENABLED === "true",
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
        apiKey: envVars.GRAFANA_LOKI_API_KEY ?? envVars.GRAFANA_LOKI_API_KEY,
        // bearerToken: envVars.GRAFANA_LOKI_BEARER_TOKEN,
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
  ...(envConfig as { default?: Record<string, unknown> }).default,
};

Object.freeze(finalConfig);

export default finalConfig;
