/**
 * IRedisConnection - Interface for Redis connection
 * 
 * Compatible with IORedis API and ExtendedRedis from @auth/config.
 * Designed to match ioredis method signatures for zero-cast compatibility.
 */
export interface IRedisConnection {
    /**
     * Get a value by key
     */
    get(key: string): Promise<string | null>;

    /**
     * Get all keys matching pattern
     */
    keys(pattern: string): Promise<string[]>;

    /**
     * Set a value with optional expiry
     * Signature matches ioredis overloads
     */
    set(key: string, value: string | Buffer | number, ...args: unknown[]): Promise<"OK" | null>;

    /**
     * Delete one or more keys
     */
    del(...keys: string[]): Promise<number>;

    /**
     * Check if key exists
     */
    exists(...keys: string[]): Promise<number>;

    /**
     * Ping the connection
     */
    ping(): Promise<string>;

    /**
     * Get connection status
     */
    status: string;

    /**
     * Disconnect (synchronous in ioredis)
     */
    disconnect(): void;

    /**
     * Quit gracefully
     */
    quit(): Promise<"OK">;

    /**
     * Subscribe to events
     */
    on(event: string, listener: (...args: unknown[]) => void): this;

    /**
     * Circuit breaker stats (from ExtendedRedis)
     */
    getCircuitBreakerStats?(): Record<string, unknown>;

    /**
     * Circuit breaker state (from ExtendedRedis)
     */
    getCircuitBreakerState?(): string;
}
