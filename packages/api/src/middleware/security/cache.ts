import type { IRedisConnection } from "@auth/contracts";
import { getLogger } from "@auth/config";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { API_MESSAGES } from "../../constants/api.messages.js";

const logger = getLogger();
const cacheLogger = logger.child({ module: "cache" });

/**
 * Cache middleware options
 */
export interface CacheOptions {
  keyPrefix?: string;
  shouldCache?: (req: Request, res: Response) => boolean;
}

/**
 * Cache Middleware Dependencies
 */
export interface CacheMiddlewareDeps {
  redis: IRedisConnection;
}

/**
 * Create cache middleware factory
 *
 * Factory function that creates cache middleware with injected Redis dependency.
 *
 * @param deps - Injected dependencies (Redis connection)
 * @returns Function that creates cache middleware for specific duration/options
 */
export function createCacheMiddleware(deps: CacheMiddlewareDeps) {
  const { redis } = deps;

  return (duration: number, options: CacheOptions = {}): RequestHandler => {
    const {
      keyPrefix = "cache:",
      shouldCache = (_req: Request, res: Response) => res.statusCode === 200,
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== "GET") {
        return next();
      }

      const cacheKey = `${keyPrefix}${req.originalUrl}`;

      try {
        const cached = await redis.get(cacheKey);

        if (cached !== null) {
          cacheLogger.debug({ cacheKey }, API_MESSAGES.CACHE_HIT);
          res.setHeader("X-Cache", "HIT");
          res.setHeader("X-Cache-Key", cacheKey);
          return res.json(JSON.parse(cached));
        }

        cacheLogger.debug({ cacheKey }, API_MESSAGES.CACHE_MISS);
        res.setHeader("X-Cache", "MISS");
        res.setHeader("X-Cache-Key", cacheKey);

        const originalJson = res.json.bind(res);
        res.json = function (data) {
          if (shouldCache(req, res)) {
            redis
              .setex(cacheKey, duration, JSON.stringify(data))
              .then(() => {
                cacheLogger.debug({ cacheKey, duration }, API_MESSAGES.CACHE_RESPONSE_SAVED);
              })
              .catch((error) => {
                cacheLogger.warn({ cacheKey, error: (error as Error).message }, API_MESSAGES.CACHE_SAVE_FAILED);
              });
          }
          return originalJson(data);
        };

        next();
      } catch (error) {
        cacheLogger.warn({ error: (error as Error).message }, API_MESSAGES.CACHE_ERROR);
        res.setHeader("X-Cache", "ERROR");
        next();
      }
    };
  };
}

/**
 * Cache Invalidation Dependencies
 */
export interface CacheInvalidatorDeps {
  redis: IRedisConnection;
}

/**
 * Create cache invalidation function
 *
 * @param deps - Injected dependencies (Redis connection)
 * @returns Function to invalidate cache by pattern
 */
export function createCacheInvalidator(deps: CacheInvalidatorDeps) {
  const { redis } = deps;

  return async (pattern: string): Promise<number> => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) {
        cacheLogger.debug({ pattern }, API_MESSAGES.CACHE_NO_KEYS_FOUND);
        return 0;
      }

      const deleted = await redis.del(...keys);
      cacheLogger.info({ pattern, deleted }, API_MESSAGES.CACHE_INVALIDATED);
      return deleted;
    } catch (error) {
      cacheLogger.error({ pattern, error: (error as Error).message }, API_MESSAGES.CACHE_INVALIDATE_FAILED);
      throw error;
    }
  };
}
