/**
 * QueueError - Queue operation failure
 *
 * Thrown when a queue operation fails.
 */

import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";

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
  public readonly queueName: string;

  constructor(queueName: string, message = "queue:errors.operationFailed", cause?: Error) {
    super(message, ERROR_CODES.JOB_FAILED, cause);
    this.queueName = queueName;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      queueName: this.queueName,
    };
  }
}

export default QueueError;
