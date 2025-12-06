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
export declare const createRedisCircuitBreaker: (redisConnection: any, logger: any, sentry?: any, options?: {}) => any;
//# sourceMappingURL=redis-circuit-breaker.d.ts.map