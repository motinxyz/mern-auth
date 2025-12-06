/**
 * Express error handling middleware.
 * This middleware centralizes error handling and formats the error response.
 * It should be the last middleware in the chain.
 */
import type { ErrorRequestHandler } from "express";
/**
 * Express error handling middleware.
 * This middleware centralizes error handling and formats the error response.
 * It should be the last middleware in the chain.
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export declare const errorHandler: ErrorRequestHandler;
//# sourceMappingURL=errorHandler.d.ts.map