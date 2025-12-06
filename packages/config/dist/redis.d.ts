/**
 * RedisService - Manages Redis connection lifecycle with circuit breaker
 *
 * Class-based pattern for consistency with DatabaseService, EmailService, etc.
 * Provides proper dependency injection and lifecycle management.
 * Includes circuit breaker for graceful degradation when Redis fails.
 */
export declare class RedisService {
    config: any;
    logger: any;
    sentry: any;
    connection: any;
    constructor({ config, logger, sentry }: {
        config: any;
        logger: any;
        sentry?: any;
    });
    /**
     * Initialize and return Redis connection with circuit breaker
     * @returns {Redis} Redis instance wrapped in circuit breaker
     */
    connect(): any;
    /**
     * Get existing connection or create new one
     * @returns {Redis} Redis instance with circuit breaker
     */
    getConnection(): any;
    /**
     * Get circuit breaker stats
     * @returns {Object} Circuit breaker statistics
     */
    getCircuitBreakerStats(): any;
    /**
     * Get circuit breaker state
     * @returns {string} OPEN, HALF_OPEN, or CLOSED
     */
    getCircuitBreakerState(): any;
    /**
     * Disconnect from Redis
     * @returns {Promise<void>}
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=redis.d.ts.map