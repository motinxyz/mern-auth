/**
 * Custom error for failures related to the Redis connection.
 */
export default class RedisConnectionError extends Error {
    originalError;
    constructor(originalError = null) {
        super(originalError?.message ?? "A critical Redis connection error occurred.");
        this.name = "RedisConnectionError";
        this.originalError = originalError;
    }
}
//# sourceMappingURL=RedisConnectionError.js.map