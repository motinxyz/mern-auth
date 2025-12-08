/**
 * @auth/contracts - Cache Service Interface
 *
 * Defines the contract for caching operations.
 * Implementations: RedisService, MemoryCacheService (for testing)
 */

// =============================================================================
// Cache Service Interface
// =============================================================================

/**
 * Interface for caching operations.
 *
 * Provides a thin abstraction over Redis-like caching systems.
 * Supports basic CRUD operations with TTL.
 *
 * @example
 * ```typescript
 * await cache.set('user:123:session', sessionData, 'EX', 3600);
 * const session = await cache.get('user:123:session');
 * await cache.del('user:123:session');
 * ```
 */
export interface ICacheService {
    /**
     * Get a value from cache.
     *
     * @param key - Cache key
     * @returns Value if found, null otherwise
     */
    get(key: string): Promise<string | null>;

    /**
     * Set a value in cache with optional TTL.
     *
     * @param key - Cache key
     * @param value - Value to store
     * @param expiryMode - Optional expiry mode ('EX' for seconds, 'PX' for milliseconds)
     * @param ttl - Optional time-to-live value
     * @returns 'OK' on success
     */
    set(
        key: string,
        value: string,
        expiryMode?: "EX" | "PX",
        ttl?: number
    ): Promise<string>;

    /**
     * Delete a key from cache.
     *
     * @param key - Cache key to delete
     * @returns Number of keys deleted (0 or 1)
     */
    del(key: string): Promise<number>;

    /**
     * Get the remaining TTL of a key.
     *
     * @param key - Cache key
     * @returns TTL in seconds (-2 if key doesn't exist, -1 if no TTL)
     */
    ttl(key: string): Promise<number>;

    /**
     * Check if a key exists.
     *
     * @param key - Cache key
     * @returns Number of existing keys (0 or 1)
     */
    exists(key: string): Promise<number>;

    /**
     * Ping the cache service for health check.
     *
     * @returns 'PONG' if healthy
     */
    ping(): Promise<string>;
}
