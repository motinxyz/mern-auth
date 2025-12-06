/**
 * TokenService
 *
 * Handles all token-related operations for the authentication system.
 * Follows production-grade patterns with dependency injection.
 *
 * @implements {import('@auth/contracts').ITokenService}
 */
export declare class TokenService {
    redis: any;
    config: any;
    logger: any;
    constructor({ redis, config, logger }: any);
    /**
     * Create a verification token for email verification
     *
     * @param {Object} user - User object containing _id and email
     * @returns {Promise<string>} - The verification token (unhashed)
     * @throws {TokenCreationError} - If token creation fails
     */
    createVerificationToken(user: any): Promise<string>;
}
//# sourceMappingURL=token.service.d.ts.map