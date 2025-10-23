import { registerNewUser as registerNewUserService } from "./auth.service.js";
import { HTTP_STATUS_CODES } from "../../constants/httpStatusCodes.js";
import ApiResponse from "../../utils/ApiResponse.js";


/**
 * @typedef {object} Request - Express Request object.
 * @property {object} body - The request body.
 * @property {function} t - The translation function.
 */

/**
 * @typedef {object} Response - Express Response object.
 * @property {object} locals - The locals object.
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

    // The ApiResponse instance will be picked up by the responseHandler middleware.
    res.locals.data = new ApiResponse(
      HTTP_STATUS_CODES.CREATED,
      user,
      "auth.register.success"
    );

    return next();
  } catch (error) {
    // Pass all errors to the global error handler
    next(error);
  }
};
