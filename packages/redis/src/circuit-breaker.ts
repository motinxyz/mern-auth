/**
 * Redis Circuit Breaker
 *
 * Wraps Redis operations with circuit breaker for graceful degradation.
 * Prevents cascading failures when Redis is slow or unavailable.
 */

import CircuitBreaker from "opossum";
import type { Redis } from "ioredis";
import type { ILogger } from "@auth/contracts";
import type { CircuitBreakerOptions, ExtendedRedis } from "./types.js";
import { REDIS_MESSAGES } from "./constants.js";

/**
 * Determine if a Redis command is non-critical
 * Non-critical commands can fail gracefully without breaking the app
 */
function isNonCriticalCommand(command: string | symbol): boolean {
    if (typeof command !== "string") return false;
    const nonCriticalCommands = [
        "get",
        "set",
        "setex",
        "del",
        "keys",
        "ttl",
        "incr",
        "decr",
        "expire",
    ];
    return nonCriticalCommands.includes(command.toLowerCase());
}

/**
 * Create a circuit breaker for Redis operations
 */
export function createRedisCircuitBreaker(
    redisConnection: Redis,
    logger: ILogger,
    sentry: unknown | null = null,
    options: CircuitBreakerOptions = {}
): ExtendedRedis {
    const circuitBreakerLogger = logger.child({
        module: "redis-circuit-breaker",
    });

    const timeout = options.timeout ?? 10000;

    const cbOptions = {
        timeout,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        rollingCountTimeout: 10000,
        rollingCountBuckets: 10,
        name: "redis-circuit-breaker",
        volumeThreshold: 10,
    };

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
            REDIS_MESSAGES.CB_OPENED
        );

        if (sentry !== null && sentry !== undefined) {
            (sentry as { captureMessage: (msg: string, opts: unknown) => void }).captureMessage(
                "Redis circuit breaker opened",
                {
                    level: "warning",
                    extra: {
                        stats: breaker.stats,
                        errorRate: (breaker.stats.failures / breaker.stats.fires) * 100,
                    },
                }
            );
        }
    });

    breaker.on("halfOpen", () => {
        circuitBreakerLogger.info(REDIS_MESSAGES.CB_HALF_OPEN);
    });

    breaker.on("close", () => {
        circuitBreakerLogger.info(
            {
                stats: breaker.stats,
                successRate: (breaker.stats.successes / breaker.stats.fires) * 100,
            },
            REDIS_MESSAGES.CB_CLOSED
        );

        if (sentry !== null && sentry !== undefined) {
            (sentry as { captureMessage: (msg: string, opts: unknown) => void }).captureMessage(
                "Redis circuit breaker closed - service recovered",
                {
                    level: "info",
                    extra: { stats: breaker.stats },
                }
            );
        }
    });

    breaker.on("failure", (error: Error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        circuitBreakerLogger.warn(
            { error: errorMessage },
            REDIS_MESSAGES.CB_COMMAND_FAILED
        );
    });

    breaker.on("timeout", () => {
        circuitBreakerLogger.warn(REDIS_MESSAGES.CB_COMMAND_TIMEOUT);
    });

    breaker.on("reject", () => {
        circuitBreakerLogger.warn(REDIS_MESSAGES.CB_COMMAND_REJECTED);
    });

    // Create proxy to intercept Redis commands
    const proxiedRedis = new Proxy(redisConnection, {
        get(target, prop) {
            const passThrough = [
                "on", "once", "emit", "off", "removeListener", "removeAllListeners",
                "setMaxListeners", "getMaxListeners", "listeners", "listenerCount",
                "eventNames", "prependListener", "prependOnceListener",
                "status", "options", "connect", "disconnect", "duplicate",
                "pipeline", "multi", "batch",
                "getCircuitBreakerStats", "getCircuitBreakerState",
            ];

            // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
            if (passThrough.includes(prop as string) || typeof (target as any)[prop] !== "function") {
                // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
                return (target as any)[prop];
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return async (...args: any[]) => {
                try {
                    return await breaker.fire(prop, ...args);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    circuitBreakerLogger.error(
                        { command: String(prop), error: errorMessage },
                        REDIS_MESSAGES.CB_OPERATION_FAILED
                    );

                    if (isNonCriticalCommand(prop)) {
                        circuitBreakerLogger.debug(
                            { command: prop },
                            REDIS_MESSAGES.CB_GRACEFUL_DEGRADATION
                        );
                        return null;
                    }

                    throw error;
                }
            };
        },
    });

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

    (proxiedRedis as unknown as ProxiedRedisWithStats).getCircuitBreakerStats = () =>
        breaker.stats as unknown as CircuitBreakerStats;
    (proxiedRedis as unknown as ProxiedRedisWithStats).getCircuitBreakerState = () =>
        breaker.opened ? "OPEN" : breaker.halfOpen ? "HALF_OPEN" : "CLOSED";

    return proxiedRedis as ExtendedRedis;
}
