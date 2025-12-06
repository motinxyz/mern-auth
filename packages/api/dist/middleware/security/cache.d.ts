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
export declare const cacheMiddleware: (duration: any, options?: {}) => (req: any, res: any, next: any) => Promise<any>;
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
export declare const invalidateCache: (pattern: any) => Promise<number>;
//# sourceMappingURL=cache.d.ts.map