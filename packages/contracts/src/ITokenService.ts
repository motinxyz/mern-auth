/**
 * User object for token operations
 */
export interface TokenUser {
    _id: string;
    email?: string;
}

/**
 * Token verification result
 */
export interface TokenPayload {
    userId: string;
    type: string;
}

/**
 * ITokenService - Interface for token operations
 *
 * Implementations: TokenService
 */
export interface ITokenService {
    /**
     * Create a verification token for a user
     */
    createVerificationToken(user: TokenUser): Promise<string>;

    /**
     * Verify and consume a token
     */
    verifyToken(token: string): Promise<TokenPayload>;

    /**
     * Delete a token
     */
    deleteToken(token: string): Promise<void>;
}
