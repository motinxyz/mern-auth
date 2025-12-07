/**
 * Custom error for failures that occur while trying to add a job to the BullMQ queue.
 */
export default class JobCreationError extends Error {
    readonly originalError: Error | null;
    constructor(message: string, originalError?: Error | null);
}
//# sourceMappingURL=JobCreationError.d.ts.map