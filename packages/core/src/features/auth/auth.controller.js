import { AuthService } from "./auth.service.js";
import { HTTP_STATUS_CODES } from "@auth/utils";
import { ApiResponse } from "@auth/utils";
import { RegisterUserDto } from "./dtos/RegisterUserDto.js";

// Dependencies for AuthService
import { User } from "@auth/database";
import { redisConnection, config } from "@auth/config";
import * as emailProducer from "@auth/queues/producers";
import * as tokenService from "../token/token.service.js";

// Instantiate the service with dependencies
const authService = new AuthService({
  userModel: User,
  redis: redisConnection,
  config: config,
  emailProducer: emailProducer,
  tokenService: tokenService,
});

/**
 * Handles new user registration.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
export const registerUser = async (req, res, next) => {
  try {
    const registerDto = RegisterUserDto.fromRequest(req);
    const user = await authService.register(registerDto);

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
};

/**
 * Handles email verification.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>}
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { status } = await authService.verifyUserEmail(token);
    const message =
      status === "ALREADY_VERIFIED"
        ? "auth:verify.alreadyVerified"
        : "auth:verify.success";

    res.json(new ApiResponse(HTTP_STATUS_CODES.OK, { status }, req.t(message)));
  } catch (error) {
    next(error);
  }
};
