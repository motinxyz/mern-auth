import type { Request, Response, NextFunction } from "express";
import type { RegistrationController, VerificationController } from "@auth/core";
import type { AuthAdapter } from "./auth.adapter.js";

/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication features.
 * Orchestrates the flow: Request -> Adapter -> Core Controller -> Response
 */
export class AuthController {
  authAdapter: AuthAdapter;
  registrationController: RegistrationController;
  verificationController: VerificationController;

  constructor({
    authAdapter,
    registrationController,
    verificationController,
  }: {
    authAdapter: AuthAdapter;
    registrationController: RegistrationController;
    verificationController: VerificationController;
  }) {
    this.authAdapter = authAdapter;
    this.registrationController = registrationController;
    this.verificationController = verificationController;
  }

  /**
   * Handle user registration
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = this.authAdapter.toRegisterDto(req);
      const locale = this.authAdapter.getLocale(req);
      const result = await this.registrationController.registerUser(
        dto,
        locale
      );
      this.authAdapter.toExpressResponse(result, res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle email verification
   * GET /api/v1/auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = this.authAdapter.toVerifyEmailDto(req);
      const locale = this.authAdapter.getLocale(req);
      const result = await this.verificationController.verifyEmail(dto, locale);
      this.authAdapter.toExpressResponse(result, res);
    } catch (error) {
      next(error);
    }
  };
}
