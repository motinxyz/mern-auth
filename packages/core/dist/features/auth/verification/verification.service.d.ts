/**
 * Service responsible ONLY for email verification logic
 * Single Responsibility: Handle email verification process
 */
export declare class VerificationService {
    /**
     * @param {Object} deps - Dependencies
     * @param {import("mongoose").Model} deps.userModel - Mongoose User model
     * @param {import("@auth/contracts").ICacheService} deps.redis - Cache service (Redis)
     * @param {Object} deps.config - Application configuration
     * @param {Object} deps.logger - Pino logger
     */
    User: any;
    redis: any;
    config: any;
    logger: any;
    constructor({ userModel, redis, config, logger }: any);
    verify(token: any): Promise<{
        status: "ALREADY_VERIFIED";
    } | {
        status: "VERIFIED";
    }>;
}
//# sourceMappingURL=verification.service.d.ts.map