/**
 * Redis Connection Factory
 * Provides lazy singleton pattern for Redis connection
 *
 * This eliminates side-effects on module import and allows for:
 * - Deferred initialization
 * - Testability (reset between tests)
 * - Explicit connection lifecycle management
 */
import { getLogger } from "./logger.js";
import { RedisService, type ExtendedRedis } from "./redis.js";
import config from "./env.js";

let redisService: RedisService | null = null;
let redisConnection: ExtendedRedis | null = null;

/**
 * Get Redis connection using lazy singleton pattern
 * Connection is created on first call and cached for subsequent calls
 *
 * @returns {ExtendedRedis} Redis connection with circuit breaker
 */
export function getRedisConnection(): ExtendedRedis {
    if (!redisConnection) {
        const logger = getLogger();
        redisService = new RedisService({ config, logger });
        redisConnection = redisService.connect();
    }
    return redisConnection;
}

/**
 * Reset Redis connection singleton
 * Used primarily for testing to ensure clean state between tests
 *
 * @returns {Promise<void>}
 */
export async function resetRedisConnection(): Promise<void> {
    if (redisService) {
        await redisService.disconnect();
        redisService = null;
        redisConnection = null;
    }
}
