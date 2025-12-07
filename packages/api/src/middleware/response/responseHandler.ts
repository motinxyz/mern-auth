import { ApiResponse, HTTP_STATUS_CODES } from "@auth/utils";
import type { Request, Response, NextFunction } from "express";

interface ResponseLocals {
  data?: {
    statusCode: number;
    data: unknown;
    message: string;
  };
}

type RequestWithT = Request & {
  t: (key: string) => string;
};

/**
 * Middleware to handle successful responses.
 * It checks for data in `res.locals.data` and sends a standardized JSON response.
 */
export const responseHandler = (req: RequestWithT, res: Response<unknown, ResponseLocals>, next: NextFunction) => {
  // If there's no data, it's likely a 404 or an unhandled route, so we pass to the next middleware (which should be the error handler).
  if (res.locals.data === undefined) {
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
