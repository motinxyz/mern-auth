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
export class AuthAdapter {
  logger: ILogger;
  config: IConfig;

  constructor({ logger, config }: { logger: ILogger; config: IConfig }) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Convert Express request to RegistrationDto
   * @param {Request} req
   * @returns {RegistrationDto}
   */
  toRegisterDto(req: Request): RegistrationDto {
    return new RegistrationDto({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
  }

  /**
   * Convert Express request to VerificationDto
   * @param {Request} req
   * @returns {VerificationDto}
   */
  toVerifyEmailDto(req: Request): VerificationDto {
    return new VerificationDto({
      token: req.query.token as string,
    });
  }

  /**
   * Convert controller result to Express response
   * @param {ControllerResult} result - Controller result
   * @param {Response} res - Express response
   * @returns {Response}
   */
  toExpressResponse(result: ControllerResult, res: Response): Response {
    if (this.logger) {
      this.logger.debug({ statusCode: result.statusCode }, "Sending response");
    }
    return res.status(result.statusCode).json(result.data);
  }

  /**
   * Extract locale from Express request
   * @param {Request} req - Express request
   * @returns {string}
   */
  getLocale(req: Request): string {
    return (req as any).locale || req.headers["accept-language"]?.split(",")[0] || "en";
  }
}
