import BaseConsumer from "./base.consumer.js";
/**
 * Email Job Consumer
 * Processes email-related jobs from the queue.
 * Uses BaseConsumer for common tracing and logging functionality.
 */
declare class EmailConsumer extends BaseConsumer {
    /**
     * @param {object} options
     * @param {object} options.emailService - Service capable of sending emails
     * @param {object} options.logger - Pino logger instance
     */
    emailService: any;
    constructor(options: any);
    /**
     * Process an email job
     * @param {object} job - BullMQ job
     * @returns {Promise<object>} Processing result
     */
    process(job: any): Promise<any>;
    /**
     * Handle verification email job
     * @private
     */
    handleVerificationEmail(job: any, data: any, jobLogger: any): Promise<{
        status: string;
        message: string;
    }>;
}
/**
 * Create email job consumer (Factory Pattern)
 * @param {object} options
 * @param {object} options.emailService - Service capable of sending emails
 * @param {object} options.logger - Pino logger instance
 * @returns {Function} Job processor function for WorkerService
 */
export declare const createEmailJobConsumer: (options: any) => (job: any) => Promise<any>;
export { EmailConsumer };
//# sourceMappingURL=email.consumer.d.ts.map