/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication features.
 * Orchestrates the flow: Request -> Adapter -> Core Controller -> Response
 */
export class AuthController {
  authAdapter: any;
  registrationController: any;
  verificationController: any;

  constructor({ authAdapter, registrationController, verificationController }: any) {
    this.authAdapter = authAdapter;
    this.registrationController = registrationController;
    this.verificationController = verificationController;
  }

  /**
   * Handle user registration
   * POST /api/v1/auth/register
   */
  register = async (req, res, next) => {
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
  verifyEmail = async (req, res, next) => {
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
