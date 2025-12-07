import type { ILogger, IConfig, ICacheService } from "@auth/contracts";
interface UserIdentity {
    _id: string | {
        toString(): string;
    };
    email: string;
}
/**
 * TokenService
 *
 * Handles all token-related operations for the authentication system.
 * Follows production-grade patterns with dependency injection.
 *
 * @implements {import('@auth/contracts').ITokenService}
 */
export declare class TokenService {
    redis: ICacheService;
    config: IConfig;
    logger: ILogger;
    constructor({ redis, config, logger }: {
        redis: ICacheService;
        config: IConfig;
        logger: ILogger;
    });
    /**
     * Create a verification token for email verification
     *
     * @param {Object} user - User object containing _id and email
     * @returns {Promise<string>} - The verification token (unhashed)
     * @throws {TokenCreationError} - If token creation fails
     */
    createVerificationToken(user: UserIdentity): Promise<string>;
    /**
     * Verify and consume a token
     */
    verifyToken(_token: string): Promise<{
        userId: string;
        type: string;
    }>;
    /**
     * Delete a token
     */
    deleteToken(_token: string): Promise<void>;
}
export {};
//# sourceMappingURL=token.service.d.ts.map