/**
 * Custom error for failures that occur while dispatching an email.
 */
export default class EmailDispatchError extends Error {
    originalError;
    constructor(message, originalError = null) {
        super(message);
        this.name = "EmailDispatchError";
        this.originalError = originalError;
    }
}
//# sourceMappingURL=EmailDispatchError.js.map