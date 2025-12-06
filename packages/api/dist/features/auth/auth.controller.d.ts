import type { Request, Response, NextFunction } from "express";
import type { RegistrationController, VerificationController } from "@auth/core";
import type { AuthAdapter } from "./auth.adapter.js";
/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication features.
 * Orchestrates the flow: Request -> Adapter -> Core Controller -> Response
 */
export declare class AuthController {
    authAdapter: AuthAdapter;
    registrationController: RegistrationController;
    verificationController: VerificationController;
    constructor({ authAdapter, registrationController, verificationController, }: {
        authAdapter: AuthAdapter;
        registrationController: RegistrationController;
        verificationController: VerificationController;
    });
    /**
     * Handle user registration
     * POST /api/v1/auth/register
     */
    register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Handle email verification
     * GET /api/v1/auth/verify-email
     */
    verifyEmail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map