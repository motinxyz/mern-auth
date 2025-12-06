/**
 * @class ApiError
 * @extends Error
 * @description A standardized error class for API responses.
 */
export interface ValidationError {
    field?: string;
    message?: string;
    code?: string;
    stack?: string;
    [key: string]: unknown;
}
export default class ApiError extends Error {
    readonly statusCode: number;
    readonly data: null;
    readonly success: false;
    readonly errors: ValidationError[];
    constructor(statusCode: number, message?: string, errors?: ValidationError[], stack?: string);
}
//# sourceMappingURL=ApiError.d.ts.map