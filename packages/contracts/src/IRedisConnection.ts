/**
 * IRedisConnection - Interface for Redis connection
 * 
 * Compatible with IORedis API
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
     */
    set(key: string, value: string, expiryMode?: "EX" | "PX", time?: number): Promise<"OK">;

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
     * Disconnect
     */
    disconnect(): Promise<void>;

    /**
     * Quit gracefully
     */
    quit(): Promise<"OK">;

    /**
     * Subscribe to events
     */
    on(event: string, listener: (...args: unknown[]) => void): this;
}
