/**
 * @auth/contracts - Token Service Interface
 *
 * Defines the contract for token operations used in verification flows.
 * Implementations: TokenService
 */

// =============================================================================
// Token Types
// =============================================================================

/**
 * Minimal user object required for token operations.
 * Contains only the fields necessary for generating verification tokens.
 */
export interface TokenUser {
    /** User's unique identifier */
    readonly _id: string;
    /** User's email address */
    readonly email: string;
}

/**
 * Decoded token payload after successful verification.
 */
export interface TokenPayload {
    /** ID of the user this token belongs to */
    readonly userId: string;
    /** Type of token (e.g., 'verification', 'password-reset') */
    readonly type: string;
}

// =============================================================================
// Token Service Interface
// =============================================================================

/**
 * Interface for token operations.
 *
 * Handles creation, verification, and deletion of tokens used in
 * authentication flows like email verification and password reset.
 *
 * @example
 * ```typescript
 * const token = await tokenService.createVerificationToken(user);
 * const payload = await tokenService.verifyToken(token);
 * await tokenService.deleteToken(token);
 * ```
 */
export interface ITokenService {
    /**
     * Create a verification token for a user.
     * Token should be stored securely (e.g., in Redis) with an expiration.
     *
     * @param user - The user to create a token for
     * @returns The generated token string
     */
    createVerificationToken(user: TokenUser): Promise<string>;

    /**
     * Verify and consume a token.
     * Token should be invalidated after successful verification.
     *
     * @param token - The token string to verify
     * @returns The decoded token payload
     * @throws Error if token is invalid, expired, or already consumed
     */
    verifyToken(token: string): Promise<TokenPayload>;

    /**
     * Delete a token explicitly.
     * Used for cleanup or manual invalidation.
     *
     * @param token - The token string to delete
     */
    deleteToken(token: string): Promise<void>;
}
