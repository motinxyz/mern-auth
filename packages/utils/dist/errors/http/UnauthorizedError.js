/**
 * UnauthorizedError (401)
 *
 * Thrown when authentication is required and has failed or has not been provided.
 */
import { ERROR_CODES } from "../../types/index.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import { HttpError } from "../base/HttpError.js";
export class UnauthorizedError extends HttpError {
    constructor(message = "auth:errors.unauthorized", errors = [], cause) {
        super(HTTP_STATUS_CODES.UNAUTHORIZED, message, ERROR_CODES.UNAUTHORIZED, errors, cause);
        this.name = "UnauthorizedError";
    }
}
//# sourceMappingURL=UnauthorizedError.js.map