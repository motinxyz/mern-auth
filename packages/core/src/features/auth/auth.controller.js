import { HTTP_STATUS_CODES, ApiResponse } from "@auth/utils";
import { RegisterUserDto } from "./dtos/RegisterUserDto.js";

export class AuthController {
  constructor(authService) {
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
  async registerUser(req, res, next) {
    try {
      const registerDto = RegisterUserDto.fromRequest(req);
      const user = await this.authService.register(registerDto);

      res
        .status(HTTP_STATUS_CODES.CREATED)
        .json(
          new ApiResponse(
            HTTP_STATUS_CODES.CREATED,
            user,
            req.t("auth:register.success")
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles email verification.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next middleware function.
   * @returns {Promise<void>}
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const { status } = await this.authService.verifyUserEmail(token);
      const message =
        status === "ALREADY_VERIFIED"
          ? "auth:verify.alreadyVerified"
          : "auth:verify.success";

      res.json(
        new ApiResponse(HTTP_STATUS_CODES.OK, { status }, req.t(message))
      );
    } catch (error) {
      next(error);
    }
  }
}
