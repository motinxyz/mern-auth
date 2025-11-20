import {
  registerNewUser as registerNewUserService,
  verifyUserEmail as verifyUserEmailService,
} from "./auth.service.js";
import { HTTP_STATUS_CODES } from "@auth/utils";
import { ApiResponse } from "@auth/utils";

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
    const user = await registerNewUserService(req.body, req);

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
    console.log("Error in registerUser controller:", error); // Diagnostic log
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
    const { status } = await verifyUserEmailService(token);
    const message =
      status === "ALREADY_VERIFIED"
        ? "auth:verify.alreadyVerified"
        : "auth:verify.success";

    res.json(new ApiResponse(HTTP_STATUS_CODES.OK, { status }, req.t(message)));
  } catch (error) {
    next(error);
  }
};
