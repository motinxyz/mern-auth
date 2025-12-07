/**
 * QueueError - Queue operation failure
 *
 * Thrown when a queue operation fails.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Queue error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new QueueError("emailQueue", "Failed to add job", originalError);
 * ```
 */
export class QueueError extends BaseError {
    /** Name of the queue that failed */
    queueName;
    constructor(queueName, message = "queue:errors.operationFailed", cause) {
        super(message, ERROR_CODES.JOB_FAILED, cause);
        this.queueName = queueName;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            queueName: this.queueName,
        };
    }
}
export default QueueError;
//# sourceMappingURL=QueueError.js.map