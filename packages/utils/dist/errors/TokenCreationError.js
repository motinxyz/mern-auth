/**
 * Custom error for failures that occur during token creation or storage.
 */
export default class TokenCreationError extends Error {
    originalError;
    constructor(message, originalError = null) {
        super(message);
        this.name = "TokenCreationError";
        this.originalError = originalError;
    }
}
//# sourceMappingURL=TokenCreationError.js.map