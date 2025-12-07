/**
 * ForbiddenError (403)
 *
 * Thrown when the user is authenticated but does not have permission to access the resource.
 */
import { ERROR_CODES } from "../../types/index.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import { HttpError } from "../base/HttpError.js";
export class ForbiddenError extends HttpError {
    constructor(message = "auth:errors.forbidden", errors = [], cause) {
        super(HTTP_STATUS_CODES.FORBIDDEN, message, ERROR_CODES.FORBIDDEN, errors, cause);
        this.name = "ForbiddenError";
    }
}
//# sourceMappingURL=ForbiddenError.js.map