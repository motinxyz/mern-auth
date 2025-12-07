import ApiError from "../ApiError.js";
/**
 * ValidationError
 * Thrown when request validation fails
 *
 * @example
 * throw new ValidationError([
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'password', message: 'Password too short' }
 * ]);
 */
export interface ZodIssue {
    path: string | string[];
    message: string;
}
export interface CustomIssue {
    field?: string;
    message: string;
    context?: Record<string, unknown>;
}
export type ValidationIssue = ZodIssue | CustomIssue;
/**
 * ValidationError
 * Thrown when request validation fails
 *
 * @example
 * throw new ValidationError([
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'password', message: 'Password too short' }
 * ]);
 */
declare class ValidationError extends ApiError {
    constructor(errors?: ValidationIssue[], message?: string);
}
export default ValidationError;
//# sourceMappingURL=ValidationError.d.ts.map