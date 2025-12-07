/**
 * ApiError - Legacy compatibility wrapper
 *
 * @deprecated Use HttpError or specific error classes instead.
 *
 * This class is kept for backward compatibility and will be removed in v2.
 * It now extends HttpError for consistency with the new error hierarchy.
 */
import { HttpError } from "./errors/HttpError.js";
import { ERROR_CODES } from "./types/index.js";
/**
 * @deprecated Use HttpError or specific error classes instead.
 */
export class ApiError extends HttpError {
    constructor(statusCode = 500, message = "system:errors.internal", errors = []) {
        super(statusCode, message, ERROR_CODES.INTERNAL_ERROR, errors);
    }
}
export default ApiError;
//# sourceMappingURL=ApiError.js.map