/**
 * Creates the Redis key for email verification rate limiting.
 * @param {string} prefix - The Redis prefix for the key.
 * @param {string} email - The user's email address.
 * @returns {string} The Redis key.
 */
export declare const createAuthRateLimitKey: (prefix: string, email: string) => string;
/**
 * Creates the Redis key for the email verification token.
 * @param {string} prefix - The Redis prefix for the key.
 * @param {string} hashedToken - The hashed verification token.
 * @returns {string} The Redis key.
 */
export declare const createVerifyEmailKey: (prefix: string, hashedToken: string) => string;
//# sourceMappingURL=redis.utils.d.ts.map