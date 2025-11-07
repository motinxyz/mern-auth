import ApiResponse from "../core/api/ApiResponse.js";
import { HTTP_STATUS_CODES } from "@auth/utils";

/**
 * Middleware to handle successful responses.
 * It checks for data in `res.locals.data` and sends a standardized JSON response.
 */
export const responseHandler = (req, res, next) => {
  // If there's no data, it's likely a 404 or an unhandled route, so we pass to the next middleware (which should be the error handler).
  if (!res.locals.data) {
    return next();
  }

  const { statusCode, data, message } = res.locals.data;

  // Translate the message key
  const translatedMessage = req.t(message);

  // Create a standardized response object
  const response = new ApiResponse(statusCode, data, translatedMessage);

  // Send the response
  res.status(statusCode || HTTP_STATUS_CODES.OK).json(response);
};