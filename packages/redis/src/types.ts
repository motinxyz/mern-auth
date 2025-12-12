/**
 * @auth/redis - Types
 *
 * Self-contained configuration interface for Redis package.
 * Does not depend on global IConfig.
 */

import type { Redis } from "ioredis";

/**
 * Configuration options for RedisService.
 * Only includes what the Redis package needs.
 */
export interface RedisOptions {
    /** Redis connection URL */
    url: string;
    /** Environment (affects lazyConnect behavior) */
    env: "development" | "production" | "test";
    /** Circuit breaker timeout in milliseconds (default: 10000) */
    circuitBreakerTimeout?: number;
}

/**
 * ExtendedRedis - ioredis instance with circuit breaker extensions
 */
export interface ExtendedRedis extends Redis {
    getCircuitBreakerStats(): Record<string, unknown>;
    getCircuitBreakerState(): string;
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    volumeThreshold?: number;
}
