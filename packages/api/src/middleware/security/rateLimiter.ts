import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { RedisStore } = require("rate-limit-redis");
import type { IRedisConnection } from "@auth/contracts";
import { config, t } from "@auth/config";
import type { Request, Response } from "express";

/**
 * Rate Limiter Dependencies
 */
export interface RateLimiterDeps {
  redis: IRedisConnection;
}

/**
 * Create a Redis store for rate limiting
 */
function createRedisStore(redis: IRedisConnection, prefix: string) {
  return new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])),
    prefix,
  });
}

/**
 * Create API rate limiter middleware
 *
 * @param deps - Injected dependencies (Redis connection)
 * @returns Express rate limiter middleware
 */
export function createApiLimiter(deps: RateLimiterDeps): RequestHandler {
  const { redis } = deps;

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(redis, "rl:api:"),
    message: (_req: Request, res: Response) => {
      const retryAfter = res.getHeader("Retry-After");
      const retryAfterMinutes = Math.ceil(Number(retryAfter) / 60);
      return t("rateLimit:apiTooManyRequests", { retryAfterMinutes });
    },
  });
}

/**
 * Create Auth rate limiter middleware
 *
 * @param deps - Injected dependencies (Redis connection)
 * @returns Express rate limiter middleware
 */
export function createAuthLimiter(deps: RateLimiterDeps): RequestHandler {
  const { redis } = deps;

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(redis, "rl:auth:"),
    message: (_req: Request, res: Response) => {
      const retryAfter = res.getHeader("Retry-After");
      const retryAfterMinutes = Math.ceil(Number(retryAfter) / 60);
      return t("rateLimit:authTooManyAttempts", { retryAfterMinutes });
    },
    skip: () => config.isDevelopment,
  });
}
