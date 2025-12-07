import type { Request, Response, NextFunction } from "express";
/**
 * API Response Caching Middleware
 *
 * Caches GET request responses in Redis for a specified duration.
 * Useful for read-heavy endpoints that don't change frequently.
 *
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
interface CacheOptions {
    keyPrefix?: string;
    shouldCache?: (req: Request, res: Response) => boolean;
}
export declare const cacheMiddleware: (duration: number, options?: CacheOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
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
export declare const invalidateCache: (pattern: string) => Promise<number>;
export {};
//# sourceMappingURL=cache.d.ts.map