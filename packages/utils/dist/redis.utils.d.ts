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
//# sourceMappingURL=redis.utils.d.ts.map