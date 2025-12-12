/**
 * Redis Package Constants
 *
 * Centralized messages for dev-facing logs and errors.
 */

export const REDIS_MESSAGES = {
    CONNECTED: "Redis connected successfully",
    READY: "Redis ready to accept commands",
    DISCONNECTED: "Redis disconnected",
    CONNECTION_ERROR: "Redis connection error",
    INIT_FAILED: "Failed to initialize Redis connection",

    // Circuit Breaker
    CB_OPENED: "Redis circuit breaker OPENED - Redis operations will fail fast",
    CB_HALF_OPEN: "Redis circuit breaker HALF-OPEN - Testing Redis recovery",
    CB_CLOSED: "Redis circuit breaker CLOSED - Redis recovered",
    CB_COMMAND_FAILED: "Redis command failed",
    CB_COMMAND_TIMEOUT: "Redis command timed out (>3s)",
    CB_COMMAND_REJECTED: "Redis command rejected - circuit is OPEN",
    CB_OPERATION_FAILED: "Redis operation failed through circuit breaker",
    CB_GRACEFUL_DEGRADATION: "Non-critical Redis command failed, returning null for graceful degradation",
};

export const REDIS_ERRORS = {
    MISSING_OPTIONS: "Options are required for RedisService",
    MISSING_LOGGER: "Logger is required for RedisService",
    URL_REQUIRED: "Redis URL is required",
    INIT_FAILED: "Redis initialization failed",
};
