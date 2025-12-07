/**
 * QueueError - Queue operation failure
 *
 * Thrown when a queue operation fails.
 */
import { BaseError } from "../base/BaseError.js";
/**
 * Queue error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new QueueError("emailQueue", "Failed to add job", originalError);
 * ```
 */
export declare class QueueError extends BaseError {
    /** Name of the queue that failed */
    readonly queueName: string;
    constructor(queueName: string, message?: string, cause?: Error);
    toJSON(): Record<string, unknown>;
}
export default QueueError;
//# sourceMappingURL=QueueError.d.ts.map