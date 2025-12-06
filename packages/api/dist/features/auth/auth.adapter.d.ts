import { RegistrationDto, VerificationDto } from "@auth/core";
/**
 * Adapter to convert between Express requests/responses and Core DTOs
 * This is the ONLY place where Express-specific code touches Core logic
 *
 * Uses Dependency Injection for testability and flexibility
 */
export declare class AuthAdapter {
    logger: any;
    config: any;
    constructor({ logger, config }?: any);
    /**
     * Convert Express request to RegistrationDto
     * @param {import('express').Request} req
     * @returns {RegistrationDto}
     */
    toRegisterDto(req: any): RegistrationDto;
    /**
     * Convert Express request to VerificationDto
     * @param {import('express').Request} req
     * @returns {VerificationDto}
     */
    toVerifyEmailDto(req: any): VerificationDto;
    /**
     * Convert controller result to Express response
     * @param {ControllerResult} result - Controller result
     * @param {Response} res - Express response
     * @returns {Response}
     */
    toExpressResponse(result: any, res: any): any;
    /**
     * Extract locale from Express request
     * @param {Request} req - Express request
     * @returns {string}
     */
    getLocale(req: any): any;
}
//# sourceMappingURL=auth.adapter.d.ts.map