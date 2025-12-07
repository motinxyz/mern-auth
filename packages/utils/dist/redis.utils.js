/**
 * Redis Key Utilities
 *
 * Helpers for constructing Redis keys with consistent naming patterns.
 */
/**
 * Creates a Redis key for rate limiting authentication operations.
 *
 * @param prefix - The Redis prefix for the key (e.g., "ratelimit:verify:")
 * @param identifier - The unique identifier (e.g., email address)
 * @returns The constructed Redis key
 *
 * @example
 * ```typescript
 * const key = createAuthRateLimitKey("ratelimit:verify:", "user@example.com");
 * // Returns: "ratelimit:verify:user@example.com"
 * ```
 */
export function createAuthRateLimitKey(prefix, identifier) {
    if (!prefix) {
        throw new Error("Redis key prefix is required");
    }
    if (!identifier) {
        throw new Error("Redis key identifier is required");
    }
    return `${prefix}${identifier}`;
}
/**
 * Creates a Redis key for email verification tokens.
 *
 * @param prefix - The Redis prefix for the key (e.g., "token:verify:")
 * @param hashedToken - The hashed verification token
 * @returns The constructed Redis key
 *
 * @example
 * ```typescript
 * const key = createVerifyEmailKey("token:verify:", "abc123hash");
 * // Returns: "token:verify:abc123hash"
 * ```
 */
export function createVerifyEmailKey(prefix, hashedToken) {
    if (!prefix) {
        throw new Error("Redis key prefix is required");
    }
    if (!hashedToken) {
        throw new Error("Hashed token is required");
    }
    return `${prefix}${hashedToken}`;
}
/**
 * Creates a Redis key for session storage.
 *
 * @param prefix - The Redis prefix for the key (e.g., "session:")
 * @param sessionId - The session ID
 * @returns The constructed Redis key
 *
 * @example
 * ```typescript
 * const key = createSessionKey("session:", "sess_abc123");
 * // Returns: "session:sess_abc123"
 * ```
 */
export function createSessionKey(prefix, sessionId) {
    if (!prefix) {
        throw new Error("Redis key prefix is required");
    }
    if (!sessionId) {
        throw new Error("Session ID is required");
    }
    return `${prefix}${sessionId}`;
}
//# sourceMappingURL=redis.utils.js.map