/**
 * RedisConnectionError - Redis connection failure
 *
 * Thrown when the application fails to connect to Redis.
 */
import { BaseError } from "./BaseError.js";
/**
 * Redis connection error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new RedisConnectionError("Redis connection timed out", originalError);
 * ```
 */
export declare class RedisConnectionError extends BaseError {
    constructor(message?: string, cause?: Error);
}
export default RedisConnectionError;
//# sourceMappingURL=RedisConnectionError.d.ts.map