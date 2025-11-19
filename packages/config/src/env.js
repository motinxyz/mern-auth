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
  dotenv.config({ path: path.resolve(root, ".env.test") });
} else {
  dotenv.config({ path: path.resolve(root, ".env") });
}

const envSchema = z.object({
  NODE_ENV: z
    .enum([Environments.DEVELOPMENT, Environments.PRODUCTION, Environments.TEST])
    .default(DEFAULTS.NODE_ENV),
  PORT: z.coerce.number().default(DEFAULTS.PORT),
  MONGO_URI: z
    .string()
    .min(1, {
      message: JSON.stringify({
        message: "validation:required",
        params: { field: "MONGO_URI" },
      }),
    })
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      {
        message: JSON.stringify({
          message: "validation:invalidUrl",
          params: { field: "MONGO_URI" },
        }),
      }
    ),
  DB_NAME: z.string().min(1).default(DEFAULTS.DB_NAME),
  CLIENT_URL: z
    .string()
    .default(DEFAULTS.CLIENT_URL)
    .refine((val) => urlRegex.test(val), {
      message: JSON.stringify({
        message: "validation:invalidUrl",
        params: { field: "CLIENT_URL" },
      }),
    }),
  REDIS_URL: z
    .string()
    .trim()
    .refine((val) => urlRegex.test(val), {
      message: JSON.stringify({
        message: "validation:invalidUrl",
        params: { field: "REDIS_URL" },
      }),
    }),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z
    .string()
    .email({
      message: JSON.stringify({
        message: "validation:invalidEmail",
        params: { field: "EMAIL_FROM" },
      }),
    })
    .optional(),
  VERIFICATION_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .default(DEFAULTS.VERIFICATION_TOKEN_EXPIRES_IN),
  LOG_LEVEL: z.string().default(DEFAULTS.LOG_LEVEL),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(DEFAULTS.BCRYPT_SALT_ROUNDS),
  DB_MAX_RETRIES: z.coerce.number().default(DEFAULTS.DB_MAX_RETRIES),
  DB_INITIAL_RETRY_DELAY_MS: z.coerce.number().default(DEFAULTS.DB_INITIAL_RETRY_DELAY_MS),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().default(DEFAULTS.SHUTDOWN_TIMEOUT_MS),
  REDIS_MAX_RETRIES: z.coerce.number().default(DEFAULTS.REDIS_MAX_RETRIES),
  REDIS_RETRY_DELAY_MS: z.coerce.number().default(DEFAULTS.REDIS_RETRY_DELAY_MS),
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
  emailFrom: envVars.EMAIL_FROM,
  verificationTokenExpiresIn: envVars.VERIFICATION_TOKEN_EXPIRES_IN,
  logLevel: envVars.NODE_ENV === "development" ? "debug" : envVars.LOG_LEVEL,
  bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
  dbMaxRetries: envVars.DB_MAX_RETRIES,
  dbInitialRetryDelayMs: envVars.DB_INITIAL_RETRY_DELAY_MS,
  shutdownTimeoutMs: envVars.SHUTDOWN_TIMEOUT_MS,
  redisMaxRetries: envVars.REDIS_MAX_RETRIES,
  redisRetryDelayMs: envVars.REDIS_RETRY_DELAY_MS,
  TOKEN_REDIS_PREFIXES: {
    VERIFY_EMAIL: envVars.REDIS_PREFIX_VERIFY_EMAIL,
  },
  AUTH_REDIS_PREFIXES: {
    VERIFY_EMAIL_RATE_LIMIT: envVars.REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT,
  },
  ...envConfig.default,
};

export const TOKEN_REDIS_PREFIXES = finalConfig.TOKEN_REDIS_PREFIXES;
export const AUTH_REDIS_PREFIXES = finalConfig.AUTH_REDIS_PREFIXES;

Object.freeze(finalConfig);

export default finalConfig;
