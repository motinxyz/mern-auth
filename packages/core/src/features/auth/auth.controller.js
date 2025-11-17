import { HTTP_STATUS_CODES } from "@auth/utils";
import { ApiResponse } from "@auth/utils";

export class AuthController {
  constructor({ logger, redisConnection, t, authService }) {
    this.logger = logger.child({ module: "auth-controller" });
    this.redisConnection = redisConnection;
    this.t = t;
    this.authService = authService;
  }

  /**
   * Handles new user registration.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>}
   */
  registerUser = async (req, res, next) => {
    try {
      const user = await this.authService.registerNewUser(req.body, req.locale);

      res
        .status(HTTP_STATUS_CODES.CREATED)
        .json(
          new ApiResponse(
            HTTP_STATUS_CODES.CREATED,
            user,
            this.t("auth:register.success")
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles email verification.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>}
   */
  verifyEmail = async (req, res, next) => {
    try {
      const { token } = req.query;
      const { status } = await this.authService.verifyUserEmail(token);
      const message =
        status === "ALREADY_VERIFIED"
          ? "auth:verify.alreadyVerified"
          : "auth:verify.success";

      res.json(new ApiResponse(HTTP_STATUS_CODES.OK, { status }, this.t(message)));
    } catch (error) {
      next(error);
    }
  };
}
