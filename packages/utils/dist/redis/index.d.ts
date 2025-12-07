/**
 * Redis Module
 *
 * Redis key utilities and helpers.
 */
/**
 * Generic Redis key factory function.
 * Creates a Redis key by combining a prefix and value.
 *
 * @param prefix - The Redis prefix for the key
 * @param value - The value to append to the prefix
 * @param prefixLabel - Label for error messages (default: "prefix")
 * @param valueLabel - Label for error messages (default: "value")
 * @returns The constructed Redis key
 * @throws {Error} If prefix or value is empty
 *
 * @example
 * ```typescript
 * const key = createRedisKey("cache:", "user-123");
 * // Returns: "cache:user-123"
 * ```
 */
export declare function createRedisKey(prefix: string, value: string, prefixLabel?: string, valueLabel?: string): string;
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
export declare function createAuthRateLimitKey(prefix: string, identifier: string): string;
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
export declare function createVerifyEmailKey(prefix: string, hashedToken: string): string;
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
export declare function createSessionKey(prefix: string, sessionId: string): string;
//# sourceMappingURL=index.d.ts.map