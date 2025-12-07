/**
 * ApiError - Legacy compatibility wrapper
 *
 * @deprecated Use HttpError or specific error classes instead.
 *
 * This class is kept for backward compatibility and will be removed in v2.
 * It now extends HttpError for consistency with the new error hierarchy.
 */
import { HttpError } from "./errors/HttpError.js";
import { type ValidationErrorDetail } from "./types/index.js";
/**
 * @deprecated Use HttpError or specific error classes instead.
 */
export declare class ApiError extends HttpError {
    constructor(statusCode?: number, message?: string, errors?: ValidationErrorDetail[]);
}
export default ApiError;
//# sourceMappingURL=ApiError.d.ts.map