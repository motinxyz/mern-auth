/**
 * RegistrationService
 *
 * Handles ONLY user registration logic.
 * Dependencies injected via constructor for testability.
 */
export declare class RegistrationService {
    /**
     * @param {Object} deps - Dependencies
     * @param {import("mongoose").Model} deps.userModel - Mongoose User model
     * @param {import("@auth/contracts").ICacheService} deps.redis - Cache service (Redis)
     * @param {Object} deps.config - Application configuration
     * @param {import("@auth/contracts").IQueueProducer} deps.emailProducer - Email queue producer
     * @param {import("@auth/contracts").ITokenService} deps.tokenService - Token service
     * @param {Object} deps.sentry - Sentry error tracking
     * @param {Object} deps.logger - Pino logger
     */
    User: any;
    redis: any;
    config: any;
    emailProducer: any;
    tokenService: any;
    sentry: any;
    logger: any;
    constructor({ userModel, redis, config, emailProducer, tokenService, sentry, logger, }: any);
    register(registerUserDto: any): Promise<any>;
}
//# sourceMappingURL=registration.service.d.ts.map