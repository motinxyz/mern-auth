import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { EnvironmentError } from "../errors/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the .env file at the project root.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// A robust regex for URL validation.
const urlRegex = /^(https?|ftp|redis|rediss):\/\/[^\s/$.?#].[^\s]*$/i;

// Define a schema for your environment variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  MONGO_URI: z
    .string()
    .min(1, {
      message: JSON.stringify({
        message: "errors.validation.required",
        params: { field: "MONGO_URI" },
      }),
    })
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      {
        message: JSON.stringify({
          message: "errors.validation.invalid_url",
          params: { field: "MONGO_URI" },
        }),
      }
    ),
  // CLIENT_URL: z
  //   .string()
  //   .default("http://localhost:3000")
  //   .refine((val) => urlRegex.test(val), {
  //     message: JSON.stringify({
  //       message: "errors.validation.invalid_url",
  //       params: { field: "CLIENT_URL" },
  //     }),
  //   }),
  REDIS_URL: z.string().refine((val) => urlRegex.test(val), {
    message: JSON.stringify({
      message: "errors.validation.invalidUrl",
      params: { field: "REDIS_URL" },
    }),
  }),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  VERIFICATION_TOKEN_EXPIRES_IN: z.coerce.number().default(300),
  // JWT Configuration
  // JWT_SECRET: z.string().min(1, {
  //   message: JSON.stringify({
  //     message: "errors.validation.required",
  //     params: { field: "JWT_SECRET" },
  //   }),
  // }),
  // JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().default(30),
  // JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().default(30),

  LOG_LEVEL: z.string().default("info"),
});

// Validate and parse the environment variables
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
  // clientUrl: envVars.CLIENT_URL,
  redisUrl: envVars.REDIS_URL,
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
  // jwt: {
  //   secret: envVars.JWT_SECRET,
  //   accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
  //   refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  // },
  emailFrom: envVars.EMAIL_FROM,
  verificationTokenExpiresIn: envVars.VERIFICATION_TOKEN_EXPIRES_IN,
  logLevel: envVars.NODE_ENV === "development" ? "debug" : envVars.LOG_LEVEL,
};

export default finalConfig;
