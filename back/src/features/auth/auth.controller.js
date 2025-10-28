import {
  registerNewUser as registerNewUserService,
  verifyUserEmail as verifyUserEmailService,
} from "./auth.service.js";
import { HTTP_STATUS_CODES } from "../../constants/httpStatusCodes.js";
import ApiResponse from "../../core/api/ApiResponse.js";
import { VERIFICATION_STATUS } from "./auth.constants.js";

/**
 * @typedef {object} Request - Express Request object.
 * @property {object} body - The request body.
 * @property {function} t - The translation function.
 */

/**
 * @typedef {object} Response - Express Response object.
 */

/**
 * @typedef {function} NextFunction - Express Next function.
 */

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
    // Directly send the successful response from the controller.
    return res
      .status(HTTP_STATUS_CODES.CREATED)
      .json(
        new ApiResponse(
          HTTP_STATUS_CODES.CREATED,
          user,
          req.t("auth:register.success")
        )
      );
  } catch (error) {
    // Pass all errors to the global error handler
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

    const messageKey =
      status === VERIFICATION_STATUS.ALREADY_VERIFIED
        ? "auth:verify.alreadyVerified"
        : "auth:verify.success";

    return res
      .status(HTTP_STATUS_CODES.OK)
      .json(
        new ApiResponse(HTTP_STATUS_CODES.OK, null, req.t(messageKey))
      );
  } catch (error) {
    next(error);
  }
};
