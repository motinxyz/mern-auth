import { redisConnection, getLogger } from "@auth/config";

const logger = getLogger();
import { API_MESSAGES } from "../../constants/api.messages.js";

const cacheLogger = logger.child({ module: "cache" });

/**
 * API Response Caching Middleware
 *
 * Caches GET request responses in Redis for a specified duration.
 * Useful for read-heavy endpoints that don't change frequently.
 *
 * @param {number} duration - Cache duration in seconds
 * @param {object} options - Additional options
 * @param {string} options.keyPrefix - Custom key prefix (default: 'cache:')
 * @param {function} options.shouldCache - Custom function to determine if response should be cached
 * @returns {Function} Express middleware
 *
 * @example
 * // Cache for 5 minutes
 * router.get('/api/v1/users/:id', cacheMiddleware(300), getUserHandler);
 *
 * // Cache with custom options
 * router.get('/api/v1/posts', cacheMiddleware(60, {
 *   keyPrefix: 'posts:',
 *   shouldCache: (req, res) => res.statusCode === 200
 * }), getPostsHandler);
 */
export const cacheMiddleware = (duration, options = {}) => {
  const {
    keyPrefix = "cache:",
    shouldCache = (req, res) => res.statusCode === 200,
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Build cache key from URL and query params
    const cacheKey = `${keyPrefix}${req.originalUrl}`;

    try {
      // Try to get cached response
      const cached = await redisConnection.get(cacheKey);

      if (cached) {
        cacheLogger.debug({ cacheKey }, API_MESSAGES.CACHE_HIT);
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);
        return res.json(JSON.parse(cached));
      }

      cacheLogger.debug({ cacheKey }, API_MESSAGES.CACHE_MISS);
      res.setHeader("X-Cache", "MISS");
      res.setHeader("X-Cache-Key", cacheKey);

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Only cache if shouldCache returns true
        if (shouldCache(req, res)) {
          redisConnection
            .setex(cacheKey, duration, JSON.stringify(data))
            .then(() => {
              cacheLogger.debug(
                { cacheKey, duration },
                API_MESSAGES.CACHE_RESPONSE_SAVED
              );
            })
            .catch((error) => {
              cacheLogger.warn(
                { cacheKey, error: error.message },
                API_MESSAGES.CACHE_SAVE_FAILED
              );
            });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      // If Redis fails, continue without caching
      cacheLogger.warn({ error: error.message }, API_MESSAGES.CACHE_ERROR);
      res.setHeader("X-Cache", "ERROR");
      next();
    }
  };
};

/**
 * Invalidate cache for a specific key or pattern
 *
 * @param {string} pattern - Redis key pattern (supports wildcards)
 * @returns {Promise<number>} Number of keys deleted
 *
 * @example
 * // Invalidate specific cache
 * await invalidateCache('cache:/api/v1/users/123');
 *
 * // Invalidate all user caches
 * await invalidateCache('cache:/api/v1/users/*');
 */
/* eslint-disable import/no-unused-modules */
export const invalidateCache = async (pattern) => {
  try {
    const keys = await redisConnection.keys(pattern);
    if (keys.length === 0) {
      cacheLogger.debug({ pattern }, API_MESSAGES.CACHE_NO_KEYS_FOUND);
      return 0;
    }

    const deleted = await redisConnection.del(...keys);
    cacheLogger.info({ pattern, deleted }, API_MESSAGES.CACHE_INVALIDATED);
    return deleted;
  } catch (error) {
    cacheLogger.error(
      { pattern, error: error.message },
      API_MESSAGES.CACHE_INVALIDATE_FAILED
    );
    throw error;
  }
};
