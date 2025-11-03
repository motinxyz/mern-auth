import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { z } from "zod";

class EnvironmentError extends Error {
  constructor(issues) {
    super("Environment validation failed");
    this.name = "EnvironmentError";
    this.issues = issues;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findMonorepoRoot(startDir) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find monorepo root.");
}

const DEFAULTS = {
  NODE_ENV: "development",
  PORT: 3001,
  CLIENT_URL: "http://localhost:",
  VERIFICATION_TOKEN_EXPIRES_IN: 300, // 5 minutes
  LOG_LEVEL: "info",
  DB_NAME: "MernAuth",
  REDIS_PREFIX_VERIFY_EMAIL: "verify:",
  REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT: "verify-email-rate-limit:",
};

const urlRegex = /^(https?|ftp|redis|rediss):\/\/[^\s/$.?#].*$/i;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
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
    .refine((val) => urlRegex.test(val), {
      message: JSON.stringify({
        message: "validation:invalidUrl",
        params: { field: "REDIS_URL" },
      }),
    }),
  REDIS_PREFIX_VERIFY_EMAIL: z
    .string()
    .default(DEFAULTS.REDIS_PREFIX_VERIFY_EMAIL),
  REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT: z
    .string()
    .default(DEFAULTS.REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT),
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
});

if (process.env.NODE_ENV !== "test") {
  const root = findMonorepoRoot(__dirname);
  dotenv.config({ path: path.resolve(root, ".env") });
}

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new EnvironmentError(parsedEnv.error.issues);
}

const envVars = parsedEnv.data;

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
  TOKEN_REDIS_PREFIXES: {
    VERIFY_EMAIL: envVars.REDIS_PREFIX_VERIFY_EMAIL,
  },
  AUTH_REDIS_PREFIXES: {
    VERIFY_EMAIL_RATE_LIMIT: envVars.REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT,
  },
};

export const TOKEN_REDIS_PREFIXES = finalConfig.TOKEN_REDIS_PREFIXES;
export const AUTH_REDIS_PREFIXES = finalConfig.AUTH_REDIS_PREFIXES;

export default finalConfig;
