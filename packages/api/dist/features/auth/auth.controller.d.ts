/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication features.
 * Orchestrates the flow: Request -> Adapter -> Core Controller -> Response
 */
export declare class AuthController {
    authAdapter: any;
    registrationController: any;
    verificationController: any;
    constructor({ authAdapter, registrationController, verificationController }: any);
    /**
     * Handle user registration
     * POST /api/v1/auth/register
     */
    register: (req: any, res: any, next: any) => Promise<void>;
    /**
     * Handle email verification
     * GET /api/v1/auth/verify-email
     */
    verifyEmail: (req: any, res: any, next: any) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map