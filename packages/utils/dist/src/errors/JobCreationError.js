/**
 * Custom error for failures that occur while trying to add a job to the BullMQ queue.
 */
export default class JobCreationError extends Error {
    originalError;
    constructor(message, originalError = null) {
        super(message);
        this.name = "JobCreationError";
        this.originalError = originalError;
    }
}
//# sourceMappingURL=JobCreationError.js.map