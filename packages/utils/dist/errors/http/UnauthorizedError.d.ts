/**
 * UnauthorizedError (401)
 *
 * Thrown when authentication is required and has failed or has not been provided.
 */
import { type ValidationErrorDetail } from "../../types/index.js";
import { HttpError } from "../base/HttpError.js";
export declare class UnauthorizedError extends HttpError {
    constructor(message?: string, errors?: readonly ValidationErrorDetail[], cause?: Error);
}
//# sourceMappingURL=UnauthorizedError.d.ts.map