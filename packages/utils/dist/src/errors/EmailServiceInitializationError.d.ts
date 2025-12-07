import ApiError from "../ApiError.js";
/**
 * @class EmailServiceInitializationError
 * @augments ApiError
 * @description Custom error class for email service initialization failures.
 */
declare class EmailServiceInitializationError extends ApiError {
    /**
     * Creates an instance of EmailServiceInitializationError.
     * @param {string} message - The error message.
     * @param {Error} [originalError] - The original error that caused this error.
     */
    constructor(message: string, originalError?: Error);
}
export default EmailServiceInitializationError;
//# sourceMappingURL=EmailServiceInitializationError.d.ts.map