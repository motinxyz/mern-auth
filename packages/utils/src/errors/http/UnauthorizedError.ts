/**
 * UnauthorizedError (401)
 *
 * Thrown when authentication is required and has failed or has not been provided.
 */

import { ERROR_CODES, type ValidationErrorDetail } from "../../types/index.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import { HttpError } from "../base/HttpError.js";

export class UnauthorizedError extends HttpError {
    constructor(
        message = "auth:errors.unauthorized",
        errors: readonly ValidationErrorDetail[] = [],
        cause?: Error
    ) {
        super(
            HTTP_STATUS_CODES.UNAUTHORIZED,
            message,
            ERROR_CODES.UNAUTHORIZED,
            errors,
            cause
        );
        this.name = "UnauthorizedError";
    }
}
