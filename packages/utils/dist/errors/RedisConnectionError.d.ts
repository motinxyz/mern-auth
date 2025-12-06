/**
 * Custom error for failures related to the Redis connection.
 */
export default class RedisConnectionError extends Error {
    readonly originalError: Error | null;
    constructor(originalError?: Error | null);
}
//# sourceMappingURL=RedisConnectionError.d.ts.map