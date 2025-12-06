import ApiError from "../ApiError.js";
/**
 * EnvironmentError
 * Thrown during application startup if environment configuration is invalid
 *
 * @example
 * throw new EnvironmentError([
 *   { path: ['DATABASE_URL'], message: 'Required' },
 *   { path: ['PORT'], message: 'Must be a number' }
 * ]);
 */
declare class EnvironmentError extends ApiError {
    constructor(validationErrors?: any[]);
}
export default EnvironmentError;
//# sourceMappingURL=EnvironmentError.d.ts.map