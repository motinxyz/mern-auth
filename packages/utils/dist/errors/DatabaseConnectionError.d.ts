import ApiError from "../ApiError.js";
/**
 * @class DatabaseConnectionError
 * @extends ApiError
 * @description Represents an error that occurs when the application fails to connect to the database after multiple retries.
 * This error is critical and should lead to a graceful shutdown of the application.
 */
declare class DatabaseConnectionError extends ApiError {
    /**
     * @constructor
     * @param {Error} [originalError] - The original error that was caught.
     */
    constructor(originalError: any);
}
export default DatabaseConnectionError;
//# sourceMappingURL=DatabaseConnectionError.d.ts.map