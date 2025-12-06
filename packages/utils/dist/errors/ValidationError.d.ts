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
declare class ValidationError extends ApiError {
    constructor(errors?: any[], message?: string);
}
export default ValidationError;
//# sourceMappingURL=ValidationError.d.ts.map