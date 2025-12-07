import { Redis } from "ioredis";
import { ConfigurationError } from "@auth/utils";
import type { ILogger, IConfig } from "@auth/contracts";
import { CONFIG_MESSAGES, CONFIG_ERRORS } from "./constants/config.messages.js";
import { createRedisCircuitBreaker } from "./redis-circuit-breaker.js";

/**
 * RedisService - Manages Redis connection lifecycle with circuit breaker
 *
 * Class-based pattern for consistency with DatabaseService, EmailService, etc.
 * Provides proper dependency injection and lifecycle management.
 * Includes circuit breaker for graceful degradation when Redis fails.
 */
export interface ExtendedRedis extends Redis {
  getCircuitBreakerStats(): Record<string, unknown>;
  getCircuitBreakerState(): string;
}

export class RedisService {
  config: IConfig;
  logger: ILogger;
  sentry: unknown;
  connection: ExtendedRedis | null;

  constructor({ config, logger, sentry = null }: { config: IConfig; logger: ILogger; sentry?: unknown }) {
    // strict-boolean-expressions: These checks are technically always true if types are correct,
    // but useful for runtime safety if JS is used. We can keep them but might need suppression or explicit check.
    // If strict-boolean says condition is always true, we can remove them if we trust the caller.
    // However, for robustness, we keep them.
    if (config === undefined || config === null) {
      throw new ConfigurationError(CONFIG_ERRORS.MISSING_CONFIG);
    }
    if (logger === undefined || logger === null) {
      throw new ConfigurationError(CONFIG_ERRORS.MISSING_LOGGER);
    }

    this.config = config;
    this.logger = logger;
    this.sentry = sentry;
    this.connection = null;
  }

  /**
   * Initialize and return Redis connection with circuit breaker
   * @returns {Redis} Redis instance wrapped in circuit breaker
   */
  connect(): ExtendedRedis {
    if (this.connection) {
      return this.connection;
    }

    if (!this.config.redisUrl) {
      throw new ConfigurationError(CONFIG_ERRORS.REDIS_URL_REQUIRED);
    }

    try {
      const rawConnection = new Redis(this.config.redisUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
        // Only use lazy connect in production/development, not in tests
        // Tests need immediate connection for queue initialization
        lazyConnect: this.config.nodeEnv !== "test",
        connectTimeout: 20000, // 20s timeout for initial connection (Upstash wake-up)
        // Exponential backoff for retries (Upstash needs longer delays)
        retryStrategy: (times) => {
          const delay = Math.min(times * 200, 5000); // 200ms, 400ms, 600ms... up to 5s
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
            return true; // Reconnect on these errors
          }
          return false;
        },
        // TCP keepalive to prevent connection drops
        keepAlive: 30000, // Send keepalive every 30s
        family: 4, // Force IPv4 (more stable than IPv6 for some providers)
      });

      rawConnection.on("error", (err: unknown) => {
        // Add context to common errors
        if ((err as { code?: string }).code === "ECONNRESET") {
          this.logger.warn(
            { err },
            "Redis connection reset (ECONNRESET) - Attempting to reconnect..."
          );
        } else {
          this.logger.error({ err }, CONFIG_MESSAGES.REDIS_CONNECTION_ERROR);
        }
      });

      rawConnection.on("connect", () => {
        this.logger.info({ module: "redis" }, CONFIG_MESSAGES.REDIS_CONNECTED);
      });

      rawConnection.on("ready", () => {
        this.logger.info({ module: "redis" }, CONFIG_MESSAGES.REDIS_READY);
      });

      // Wrap connection with circuit breaker for graceful degradation
      this.connection = createRedisCircuitBreaker(
        rawConnection,
        this.logger,
        this.sentry,
        { timeout: this.config.redis.circuitBreakerTimeout }
      ) as ExtendedRedis;

      return this.connection;
    } catch (error) {
      this.logger.error({ err: error }, CONFIG_MESSAGES.REDIS_INIT_FAILED);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(
        `${CONFIG_ERRORS.REDIS_INIT_FAILED}: ${errorMessage}`
      );
    }
  }

  /**
   * Get existing connection or create new one
   * @returns {Redis} Redis instance with circuit breaker
   */
  getConnection(): ExtendedRedis {
    if (!this.connection) {
      return this.connect();
    }
    return this.connection;
  }

  /**
   * Get circuit breaker stats
   * @returns {Object} Circuit breaker statistics
   */
  getCircuitBreakerStats() {
    if (this.connection !== null && typeof this.connection.getCircuitBreakerStats === "function") {
      return this.connection.getCircuitBreakerStats();
    }
    return null;
  }

  /**
   * Get circuit breaker state
   * @returns {string} OPEN, HALF_OPEN, or CLOSED
   */
  getCircuitBreakerState() {
    if (this.connection !== null && typeof this.connection.getCircuitBreakerState === "function") {
      return this.connection.getCircuitBreakerState();
    }
    return "UNKNOWN";
  }

  /**
   * Disconnect from Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
      this.logger.info(CONFIG_MESSAGES.REDIS_DISCONNECTED);
    }
  }
}
