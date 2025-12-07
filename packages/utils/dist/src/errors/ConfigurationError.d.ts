import ApiError from "../ApiError.js";
/**
 * Custom error for handling application configuration issues.
 * This error should be thrown when the application is misconfigured.
 */
declare class ConfigurationError extends ApiError {
    constructor(message: string);
}
export default ConfigurationError;
//# sourceMappingURL=ConfigurationError.d.ts.map