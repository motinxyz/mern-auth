/**
 * ICacheService - Abstract interface for caching operations
 *
 * Implementations: RedisService, MemoryCacheService (for testing)
 *
 * @abstract
 */
export class ICacheService {
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null
   */
  async get(key) {
    throw new Error("ICacheService.get() must be implemented");
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {string} [expiryMode] - Expiry mode ('EX' for seconds, 'PX' for ms)
   * @param {number} [ttl] - Time to live
   * @returns {Promise<string>} - 'OK' on success
   */
  async set(key, value, expiryMode, ttl) {
    throw new Error("ICacheService.set() must be implemented");
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {Promise<number>} - Number of keys deleted
   */
  async del(key) {
    throw new Error("ICacheService.del() must be implemented");
  }

  /**
   * Check if a key exists
   * @param {string} key - Cache key
   * @returns {Promise<number>} - 1 if exists, 0 otherwise
   */
  async exists(key) {
    throw new Error("ICacheService.exists() must be implemented");
  }

  /**
   * Ping the cache service
   * @returns {Promise<string>} - 'PONG' on success
   */
  async ping() {
    throw new Error("ICacheService.ping() must be implemented");
  }
}
