/**
 * Creates the Redis key for email verification rate limiting.
 * @param {string} prefix - The Redis prefix for the key.
 * @param {string} email - The user's email address.
 * @returns {string} The Redis key.
 */
export const createAuthRateLimitKey = (prefix, email) => {
    return `${prefix}${email}`;
};
/**
 * Creates the Redis key for the email verification token.
 * @param {string} prefix - The Redis prefix for the key.
 * @param {string} hashedToken - The hashed verification token.
 * @returns {string} The Redis key.
 */
export const createVerifyEmailKey = (prefix, hashedToken) => {
    return `${prefix}${hashedToken}`;
};
//# sourceMappingURL=redis.utils.js.map