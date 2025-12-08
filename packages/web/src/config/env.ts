import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().transform((val) => val === "true").optional(),
  MODE: z.enum(["development", "production", "test"]).default("development"),
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
  SSR: z.boolean().default(false),
  VITE_APP_NAME: z.string().default("MERN Auth"),
  VITE_APP_URL: z.string().url().default("http://localhost:5173"),
  VITE_APP_VERSION: z.string().default("1.0.0"),
});

const processEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  SSR: import.meta.env.SSR,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 4)
  );
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsed.data,
  API_URL: parsed.data.VITE_API_URL,
  APP_NAME: parsed.data.VITE_APP_NAME,
  APP_URL: parsed.data.VITE_APP_URL,
  isDevelopment: parsed.data.DEV,
  isProduction: parsed.data.PROD,
  SENTRY_DSN: parsed.data.VITE_SENTRY_DSN,
  APP_VERSION: parsed.data.VITE_APP_VERSION,
};

export default env;
