import CircuitBreaker from "opossum";
import type { Redis } from "ioredis";
import type { ILogger } from "@auth/contracts";
import { CONFIG_MESSAGES } from "./constants/config.messages.js";

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
 * Determine if a Redis command is non-critical
 * Non-critical commands can fail gracefully without breaking the app
 */
function isNonCriticalCommand(command: string | symbol): boolean {
  if (typeof command !== "string") return false;
  const nonCriticalCommands = [
    "get", // Cache reads
    "set", // Cache writes
    "setex", // Cache writes with expiry
    "del", // Cache deletes
    "keys", // Cache key lookups
    "ttl", // Cache TTL checks
    "incr", // Rate limit counters (can fall back to memory)
    "decr",
    "expire",
  ];

  return nonCriticalCommands.includes(command.toLowerCase());
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
export const createRedisCircuitBreaker = (
  redisConnection: Redis,
  logger: ILogger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sentry: any | null = null,
  options: CircuitBreakerOptions = {}
) => {
  const circuitBreakerLogger = logger.child({
    module: "redis-circuit-breaker",
  });

  // Get timeout from options (preferred) or default
  // Upstash Redis (serverless) needs longer timeouts due to sleep/wake cycles
  const timeout = options.timeout ?? 10000;

  // Circuit breaker options
  const cbOptions = {
    timeout, // Configurable timeout (default 10s for Upstash)
    errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
    resetTimeout: 30000, // Try again after 30 seconds
    rollingCountTimeout: 10000, // 10 second window for error calculation
    rollingCountBuckets: 10, // 10 buckets in the window
    name: "redis-circuit-breaker",
    volumeThreshold: 10, // Minimum 10 requests before opening circuit
  };

  // Wrap Redis commands in circuit breaker
  // Wrap Redis commands in circuit breaker
  const executeCommand = async (...args: unknown[]) => {
    const command = args[0] as string;
    const commandArgs = args.slice(1);
    // @ts-expect-error - Redis methods access with unknown args
    // eslint-disable-next-line security/detect-object-injection
    return await redisConnection[command](...commandArgs);
  };

  const breaker = new CircuitBreaker(executeCommand, cbOptions);

  // Event handlers
  breaker.on("open", () => {
    circuitBreakerLogger.warn(
      {
        stats: breaker.stats,
        errorRate: (breaker.stats.failures / breaker.stats.fires) * 100,
      },
      CONFIG_MESSAGES.REDIS_CB_OPENED
    );

    if (sentry !== null && sentry !== undefined) {
      sentry.captureMessage("Redis circuit breaker opened", {
        level: "warning",
        extra: {
          stats: breaker.stats,
          errorRate: (breaker.stats.failures / breaker.stats.fires) * 100,
        },
      });
    }
  });

  breaker.on("halfOpen", () => {
    circuitBreakerLogger.info(CONFIG_MESSAGES.REDIS_CB_HALF_OPEN);
  });

  breaker.on("close", () => {
    circuitBreakerLogger.info(
      {
        stats: breaker.stats,
        successRate: (breaker.stats.successes / breaker.stats.fires) * 100,
      },
      CONFIG_MESSAGES.REDIS_CB_CLOSED
    );

    if (sentry !== null && sentry !== undefined) {
      sentry.captureMessage(
        "Redis circuit breaker closed - service recovered",
        {
          level: "info",
          extra: {
            stats: breaker.stats,
          },
        }
      );
    }
  });

  // Only log failures and timeouts, not every success
  breaker.on("failure", (error: Error) => {
    // Determine the error message safely
    const errorMessage = error instanceof Error ? error.message : String(error);

    circuitBreakerLogger.warn(
      { error: errorMessage },
      CONFIG_MESSAGES.REDIS_CB_COMMAND_FAILED
    );
  });

  breaker.on("timeout", () => {
    circuitBreakerLogger.warn(CONFIG_MESSAGES.REDIS_CB_COMMAND_TIMEOUT);
  });

  breaker.on("reject", () => {
    circuitBreakerLogger.warn(CONFIG_MESSAGES.REDIS_CB_COMMAND_REJECTED);
  });

  // Create proxy to intercept Redis commands
  const proxiedRedis = new Proxy(redisConnection, {
    get(target, prop) {
      // List of properties to pass through without circuit breaker
      const passThrough = [
        // EventEmitter methods
        "on",
        "once",
        "emit",
        "off",
        "removeListener",
        "removeAllListeners",
        "setMaxListeners",
        "getMaxListeners",
        "listeners",
        "listenerCount",
        "eventNames",
        "prependListener",
        "prependOnceListener",
        // IORedis specific properties
        "status",
        "options",
        "connect",
        "disconnect",
        "duplicate",
        "pipeline",
        "multi",
        "batch",
        // Circuit breaker methods we added
        "getCircuitBreakerStats",
        "getCircuitBreakerState",
      ];

      // Pass through non-command properties
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
      if (passThrough.includes(prop as string) || typeof (target as any)[prop] !== "function") {
        // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
        return (target as any)[prop];
      }

      // Wrap commands in circuit breaker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        try {
          return await breaker.fire(prop, ...args);
        } catch (error) {
          // Circuit is open or command failed
          const errorMessage = error instanceof Error ? error.message : String(error);
          circuitBreakerLogger.error(
            { command: String(prop), error: errorMessage },
            CONFIG_MESSAGES.REDIS_CB_OPERATION_FAILED
          );

          // For non-critical operations, return null instead of throwing
          // This allows graceful degradation
          if (isNonCriticalCommand(prop)) {
            circuitBreakerLogger.debug(
              { command: prop },
              CONFIG_MESSAGES.REDIS_CB_GRACEFUL_DEGRADATION
            );
            return null;
          }

          throw error;
        }
      };
    },
  });

  // Expose circuit breaker stats
  type CircuitBreakerStats = {
    failures: number;
    fires: number;
    successes: number;
    fallbacks: number;
    rejects: number;
    timeouts: number;
    [key: string]: unknown;
  };

  type ProxiedRedisWithStats = Redis & {
    getCircuitBreakerStats: () => CircuitBreakerStats;
    getCircuitBreakerState: () => string;
  };

  (proxiedRedis as unknown as ProxiedRedisWithStats).getCircuitBreakerStats = () => breaker.stats as unknown as CircuitBreakerStats;
  (proxiedRedis as unknown as ProxiedRedisWithStats).getCircuitBreakerState = () =>
    breaker.opened ? "OPEN" : breaker.halfOpen ? "HALF_OPEN" : "CLOSED";

  return proxiedRedis;
};
