/**
 * ICacheService - Interface for caching operations
 *
 * Implementations: RedisService, MemoryCacheService (for testing)
 */
export interface ICacheService {
    /**
     * Get a value from cache
     */
    get(key: string): Promise<string | null>;
    /**
     * Set a value in cache with optional TTL
     */
    set(key: string, value: string, expiryMode?: "EX" | "PX", ttl?: number): Promise<string>;
    /**
     * Delete a key from cache
     */
    del(key: string): Promise<number>;
    /**
     * Check if a key exists
     */
    exists(key: string): Promise<number>;
    /**
     * Ping the cache service
     */
    ping(): Promise<string>;
}
//# sourceMappingURL=ICacheService.d.ts.map