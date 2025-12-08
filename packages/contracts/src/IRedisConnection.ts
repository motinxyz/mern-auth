/**
 * @auth/contracts - Redis Connection Interface
 *
 * Defines the contract for Redis connections.
 * Compatible with ioredis API and ExtendedRedis from @auth/config.
 */

// =============================================================================
// Redis Connection Interface
// =============================================================================

/**
 * Interface for Redis connections.
 *
 * Designed to match ioredis method signatures for seamless integration.
 * Includes optional circuit breaker extensions for resilience.
 *
 * @example
 * ```typescript
 * await redis.set('key', 'value', 'EX', 3600);
 * const value = await redis.get('key');
 * await redis.del('key');
 * ```
 */
export interface IRedisConnection {
    /**
     * Get a value by key.
     *
     * @param key - Redis key
     * @returns Value if found, null otherwise
     */
    get(key: string): Promise<string | null>;

    /**
     * Get all keys matching a pattern.
     *
     * @param pattern - Glob-style pattern (e.g., 'user:*')
     * @returns Array of matching keys
     */
    keys(pattern: string): Promise<string[]>;

    /**
     * Set a value with optional expiry.
     * Signature matches ioredis overloads.
     *
     * @param key - Redis key
     * @param value - Value to store
     * @param args - Additional arguments (e.g., 'EX', 3600)
     * @returns 'OK' on success, null on failure
     */
    set(key: string, value: string | Buffer | number, ...args: unknown[]): Promise<"OK" | null>;

    /**
     * Delete one or more keys.
     *
     * @param keys - Keys to delete
     * @returns Number of keys deleted
     */
    del(...keys: string[]): Promise<number>;

    /**
     * Check if keys exist.
     *
     * @param keys - Keys to check
     * @returns Number of existing keys
     */
    exists(...keys: string[]): Promise<number>;

    /**
     * Ping the Redis server.
     *
     * @returns 'PONG' if connected
     */
    ping(): Promise<string>;

    /**
     * Current connection status.
     * Common values: 'ready', 'connecting', 'reconnecting', 'end'
     */
    readonly status: string;

    /**
     * Disconnect immediately (synchronous in ioredis).
     */
    disconnect(): void;

    /**
     * Quit gracefully, waiting for pending commands.
     *
     * @returns 'OK' when disconnected
     */
    quit(): Promise<"OK">;

    /**
     * Subscribe to connection events.
     *
     * @param event - Event name (e.g., 'connect', 'error', 'ready')
     * @param listener - Event handler
     * @returns this for chaining
     */
    on(event: string, listener: (...args: unknown[]) => void): this;

    /**
     * Get circuit breaker statistics (ExtendedRedis extension).
     * @returns Stats object or undefined if not using circuit breaker
     */
    getCircuitBreakerStats?(): Readonly<Record<string, unknown>>;

    /**
     * Get current circuit breaker state (ExtendedRedis extension).
     * @returns State string or undefined if not using circuit breaker
     */
    getCircuitBreakerState?(): string;
}
