import i18next from "i18next";
import * as i18nextHttpMiddleware from "i18next-http-middleware";
import { Logger } from "pino";

declare module "@auth/config" {
  interface RedisPrefixes {
    verifyEmail: string;
    verifyEmailRateLimit: string;
  }

  interface SmtpConfig {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
  }

  interface TokenRedisPrefixes {
    VERIFY_EMAIL: string;
  }

  interface AuthRedisPrefixes {
    VERIFY_EMAIL_RATE_LIMIT: string;
  }

  export interface Config {
    env: "development" | "production" | "test";
    isDevelopment: boolean;
    port: number;
    dbURI: string;
    dbName: string;
    clientUrl: string;
    redisUrl: string;
    redis: {
      prefixes: RedisPrefixes;
    };
    smtp: SmtpConfig;
    emailFrom?: string;
    verificationTokenExpiresIn: number;
    logLevel: string;
    TOKEN_REDIS_PREFIXES: TokenRedisPrefixes;
    AUTH_REDIS_PREFIXES: AuthRedisPrefixes;
  }

  export const config: Config;
  export const i18nInstance: i18next.i18n;
  export const i18nMiddleware: typeof i18nextHttpMiddleware;
  export const logger: Logger;
  export const t: (key: string, context?: Record<string, any>) => string;
  export const TOKEN_REDIS_PREFIXES: TokenRedisPrefixes;
  export const AUTH_REDIS_PREFIXES: AuthRedisPrefixes;
}
