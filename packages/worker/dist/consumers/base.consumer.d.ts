import type { ILogger } from "@auth/contracts";
/**
 * Base Consumer
 * Provides common functionality for all job consumers:
 * - Tracing with span links to original request
 * - Structured logging with job context
 * - Error handling with consistent error wrapping
 *
 * Concrete consumers should extend this class or use the factory pattern.
 */
declare class BaseConsumer {
    /**
     * @param {object} options
     * @param {object} options.logger - Pino logger instance
     * @param {string} options.name - Consumer name for tracing/logging
     */
    logger: ILogger;
    name: string;
    constructor(options: any);
    /**
     * Create a child logger with job context
     * @param {object} job - BullMQ job
     * @param {string} jobType - Type of job being processed
     * @returns {object} Child logger with context
     */
    createJobLogger(job: any, jobType: any): ILogger;
    /**
     * Wrap job processing in a span with trace context linking
     * @param {object} job - BullMQ job
     * @param {string} spanName - Name for the span
     * @param {Function} processor - Async function to execute
     * @returns {Promise<any>} Result of processor
     */
    withJobSpan(job: any, spanName: any, processor: any): Promise<any>;
    /**
     * Hash sensitive data for safe logging/tracing
     * @param {string} data - Sensitive data to hash
     * @returns {string} Hashed data
     */
    hashSensitive(data: any): string;
    /**
     * Add custom span attributes
     * @param {object} attributes - Key-value pairs to add
     */
    addAttributes(attributes: any): void;
}
export default BaseConsumer;
//# sourceMappingURL=base.consumer.d.ts.map