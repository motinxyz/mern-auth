import { RegistrationDto, VerificationDto } from "@auth/core";
import type { Request, Response } from "express";
import type { ILogger, IConfig } from "@auth/contracts";
interface ControllerResult {
    statusCode: number;
    data: unknown;
}
/**
 * Adapter to convert between Express requests/responses and Core DTOs
 * This is the ONLY place where Express-specific code touches Core logic
 *
 * Uses Dependency Injection for testability and flexibility
 */
export declare class AuthAdapter {
    logger: ILogger;
    config: IConfig;
    constructor({ logger, config }: {
        logger: ILogger;
        config: IConfig;
    });
    /**
     * Convert Express request to RegistrationDto
     * @param {Request} req
     * @returns {RegistrationDto}
     */
    toRegisterDto(req: Request): RegistrationDto;
    /**
     * Convert Express request to VerificationDto
     * @param {Request} req
     * @returns {VerificationDto}
     */
    toVerifyEmailDto(req: Request): VerificationDto;
    /**
     * Convert controller result to Express response
     * @param {ControllerResult} result - Controller result
     * @param {Response} res - Express response
     * @returns {Response}
     */
    toExpressResponse(result: ControllerResult, res: Response): Response;
    /**
     * Extract locale from Express request
     * @param {Request} req - Express request
     * @returns {string}
     */
    getLocale(req: Request): string;
}
export {};
//# sourceMappingURL=auth.adapter.d.ts.map