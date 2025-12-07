import type { Redis } from "ioredis";
import type { ILogger } from "@auth/contracts";
interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    volumeThreshold?: number;
}
/**
 * Create a circuit breaker for Redis operations
 *
 * Prevents cascading failures when Redis is slow or unavailable.
 * Fails fast and allows graceful degradation.
 *
 * @param {Object} redisConnection - IORedis instance
 * @param {Object} logger - Pino logger instance
 * @param {Object} sentry - Sentry instance (optional)
 * @param {Object} options - Configuration options
 * @returns {Object} Circuit breaker wrapped Redis client
 */
export declare const createRedisCircuitBreaker: (redisConnection: Redis, logger: ILogger, sentry?: any | null, options?: CircuitBreakerOptions) => Redis;
export {};
//# sourceMappingURL=redis-circuit-breaker.d.ts.map