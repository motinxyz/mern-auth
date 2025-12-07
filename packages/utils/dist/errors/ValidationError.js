/**
 * ValidationError - Request validation failures
 *
 * Thrown when request data fails validation (Zod, custom, etc.)
 */
import { HttpError } from "./HttpError.js";
import { HTTP_STATUS_CODES } from "../http/index.js";
import { ERROR_CODES, } from "../types/index.js";
/**
 * Validation error for failed input validation
 *
 * @example
 * ```typescript
 * throw new ValidationError([
 *   { field: 'email', message: 'validation:email.invalid' },
 *   { field: 'password', message: 'validation:password.length' }
 * ]);
 * ```
 */
export class ValidationError extends HttpError {
    constructor(issues = [], message = "validation:failed") {
        const errors = ValidationError.formatIssues(issues);
        super(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT, message, ERROR_CODES.VALIDATION_FAILED, errors);
    }
    /**
     * Convert validation issues to consistent format
     */
    static formatIssues(issues) {
        return issues.map((issue) => {
            // Zod format: has 'path' property
            if ("path" in issue) {
                const path = issue.path;
                return {
                    field: Array.isArray(path) ? path.join(".") : String(path),
                    message: issue.message,
                };
            }
            // Custom format
            const result = {
                field: issue.field ?? "unknown",
                message: issue.message ?? "validation:error",
            };
            if (issue.context !== undefined) {
                return { ...result, context: issue.context };
            }
            return result;
        });
    }
}
export default ValidationError;
//# sourceMappingURL=ValidationError.js.map