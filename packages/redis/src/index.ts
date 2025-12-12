/**
 * @auth/redis
 *
 * Dedicated Redis package for the auth monorepo.
 * Self-contained with circuit breaker support.
 *
 * @example
 * ```typescript
 * import { RedisService } from "@auth/redis";
 *
 * const redis = new RedisService({
 *   config: { url: process.env.REDIS_URL, env: "production" },
 *   logger,
 * });
 * const connection = redis.connect();
 * ```
 */

// Types
export type { RedisOptions, ExtendedRedis, CircuitBreakerOptions } from "./types.js";

// Service
export { RedisService } from "./redis.service.js";

// Circuit Breaker (for advanced usage)
export { createRedisCircuitBreaker } from "./circuit-breaker.js";

// Constants (for testing/mocking)
export { REDIS_MESSAGES, REDIS_ERRORS } from "./constants.js";
