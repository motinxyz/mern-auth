/**
 * ValidationError - Request validation failures
 *
 * Thrown when request data fails validation (Zod, custom, etc.)
 */
import { HttpError } from "../base/HttpError.js";
import { type ValidationIssue } from "../../types/index.js";
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
export declare class ValidationError extends HttpError {
    constructor(issues?: readonly ValidationIssue[], message?: string);
    /**
     * Convert validation issues to consistent format
     */
    private static formatIssues;
}
export default ValidationError;
//# sourceMappingURL=ValidationError.d.ts.map