/**
 * RedisConnectionError - Redis connection failure
 *
 * Thrown when the application fails to connect to Redis.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Redis connection error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new RedisConnectionError("Redis connection timed out", originalError);
 * ```
 */
export class RedisConnectionError extends BaseError {
    constructor(message = "system:errors.redisConnection", cause) {
        super(message, ERROR_CODES.REDIS_ERROR, cause);
    }
}
export default RedisConnectionError;
//# sourceMappingURL=RedisConnectionError.js.map