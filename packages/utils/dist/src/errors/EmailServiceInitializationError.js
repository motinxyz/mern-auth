import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";
/**
 * @class EmailServiceInitializationError
 * @augments ApiError
 * @description Custom error class for email service initialization failures.
 */
class EmailServiceInitializationError extends ApiError {
    /**
     * Creates an instance of EmailServiceInitializationError.
     * @param {string} message - The error message.
     * @param {Error} [originalError] - The original error that caused this error.
     */
    constructor(message, originalError) {
        const errors = originalError ? [{ message: originalError.message, stack: originalError.stack }] : [];
        super(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, message, errors);
        this.name = "EmailServiceInitializationError";
    }
}
export default EmailServiceInitializationError;
//# sourceMappingURL=EmailServiceInitializationError.js.map