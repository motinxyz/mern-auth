import ApiError from "../ApiError.js";
/**
 * Custom error for asynchronous errors occurring within a BullMQ Queue instance.
 */
declare class QueueError extends ApiError {
    readonly originalError: Error | null;
    constructor(originalError: Error | string | null);
}
export default QueueError;
//# sourceMappingURL=QueueError.d.ts.map