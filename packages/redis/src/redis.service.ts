/**
 * RedisService - Manages Redis connection lifecycle with circuit breaker
 *
 * Self-contained service that doesn't depend on global IConfig.
 * Accepts explicit configuration options for maximum flexibility.
 */

import { Redis } from "ioredis";
import { ConfigurationError } from "@auth/utils";
import type { ILogger } from "@auth/contracts";
import type { RedisOptions, ExtendedRedis } from "./types.js";
import { REDIS_MESSAGES, REDIS_ERRORS } from "./constants.js";
import { createRedisCircuitBreaker } from "./circuit-breaker.js";

export class RedisService {
    private readonly options: RedisOptions;
    private readonly logger: ILogger;
    private readonly sentry: unknown;
    private connection: ExtendedRedis | null;

    constructor({
        config,
        logger,
        sentry,
    }: {
        config: RedisOptions;
        logger: ILogger;
        sentry?: unknown;
    }) {
        if (config === undefined || config === null) {
            throw new ConfigurationError(REDIS_ERRORS.MISSING_OPTIONS);
        }
        if (logger === undefined || logger === null) {
            throw new ConfigurationError(REDIS_ERRORS.MISSING_LOGGER);
        }

        this.options = config;
        this.logger = logger;
        this.sentry = sentry ?? null;
        this.connection = null;
    }

    /**
     * Initialize and return Redis connection with circuit breaker
     */
    connect(): ExtendedRedis {
        if (this.connection) {
            return this.connection;
        }

        if (!this.options.url) {
            throw new ConfigurationError(REDIS_ERRORS.URL_REQUIRED);
        }

        try {
            const rawConnection = new Redis(this.options.url, {
                maxRetriesPerRequest: null, // Required for BullMQ
                enableReadyCheck: false,
                lazyConnect: this.options.env !== "test",
                connectTimeout: 20000,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 200, 5000);
                    this.logger.debug({ attempt: times, delay }, "Redis retry attempt");
                    return delay;
                },
                reconnectOnError: (err) => {
                    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
                    if (targetErrors.some((target) => err.message.includes(target))) {
                        this.logger.debug(
                            { error: err.message },
                            "Redis reconnecting due to error"
                        );
                        return true;
                    }
                    return false;
                },
                keepAlive: 30000,
                family: 4,
            });

            rawConnection.on("error", (err: unknown) => {
                if ((err as { code?: string }).code === "ECONNRESET") {
                    this.logger.warn(
                        { err },
                        "Redis connection reset (ECONNRESET) - Attempting to reconnect..."
                    );
                } else {
                    this.logger.error({ err }, REDIS_MESSAGES.CONNECTION_ERROR);
                }
            });

            rawConnection.on("connect", () => {
                this.logger.info({ module: "redis" }, REDIS_MESSAGES.CONNECTED);
            });

            rawConnection.on("ready", () => {
                this.logger.info({ module: "redis" }, REDIS_MESSAGES.READY);
            });

            this.connection = createRedisCircuitBreaker(
                rawConnection,
                this.logger,
                this.sentry,
                { timeout: this.options.circuitBreakerTimeout }
            );

            return this.connection;
        } catch (error) {
            this.logger.error({ err: error }, REDIS_MESSAGES.INIT_FAILED);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new ConfigurationError(
                `${REDIS_ERRORS.INIT_FAILED}: ${errorMessage}`
            );
        }
    }

    /**
     * Get existing connection or create new one
     */
    getConnection(): ExtendedRedis {
        if (!this.connection) {
            return this.connect();
        }
        return this.connection;
    }

    /**
     * Get circuit breaker stats
     */
    getCircuitBreakerStats() {
        if (this.connection !== null && typeof this.connection.getCircuitBreakerStats === "function") {
            return this.connection.getCircuitBreakerStats();
        }
        return null;
    }

    /**
     * Get circuit breaker state
     */
    getCircuitBreakerState() {
        if (this.connection !== null && typeof this.connection.getCircuitBreakerState === "function") {
            return this.connection.getCircuitBreakerState();
        }
        return "UNKNOWN";
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.quit();
            this.connection = null;
            this.logger.info(REDIS_MESSAGES.DISCONNECTED);
        }
    }
}
