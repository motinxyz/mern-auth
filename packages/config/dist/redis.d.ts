import { Redis } from "ioredis";
import type { ILogger, IConfig } from "@auth/contracts";
/**
 * RedisService - Manages Redis connection lifecycle with circuit breaker
 *
 * Class-based pattern for consistency with DatabaseService, EmailService, etc.
 * Provides proper dependency injection and lifecycle management.
 * Includes circuit breaker for graceful degradation when Redis fails.
 */
export interface ExtendedRedis extends Redis {
    getCircuitBreakerStats(): any;
    getCircuitBreakerState(): string;
}
export declare class RedisService {
    config: IConfig;
    logger: ILogger;
    sentry: unknown;
    connection: ExtendedRedis | null;
    constructor({ config, logger, sentry }: {
        config: IConfig;
        logger: ILogger;
        sentry?: unknown;
    });
    /**
     * Initialize and return Redis connection with circuit breaker
     * @returns {Redis} Redis instance wrapped in circuit breaker
     */
    connect(): ExtendedRedis;
    /**
     * Get existing connection or create new one
     * @returns {Redis} Redis instance with circuit breaker
     */
    getConnection(): ExtendedRedis;
    /**
     * Get circuit breaker stats
     * @returns {Object} Circuit breaker statistics
     */
    getCircuitBreakerStats(): any;
    /**
     * Get circuit breaker state
     * @returns {string} OPEN, HALF_OPEN, or CLOSED
     */
    getCircuitBreakerState(): string;
    /**
     * Disconnect from Redis
     * @returns {Promise<void>}
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=redis.d.ts.map