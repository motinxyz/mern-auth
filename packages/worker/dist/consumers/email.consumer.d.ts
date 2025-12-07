import BaseConsumer from "./base.consumer.js";
import type { ILogger, IJob, JobResult, IEmailService } from "@auth/contracts";
/**
 * Email consumer options
 */
interface EmailConsumerOptions {
    emailService: IEmailService;
    logger: ILogger;
}
/**
 * Email job data structure
 */
interface EmailJobData {
    type: string;
    data: {
        user?: {
            id: string;
            email: string;
            name: string;
        };
        token?: string;
        locale?: string;
        preferredProvider?: string;
    };
    traceContext?: {
        traceId: string;
    };
}
/**
 * Email Job Consumer
 * Processes email-related jobs from the queue.
 * Uses BaseConsumer for common tracing and logging functionality.
 */
declare class EmailConsumer extends BaseConsumer {
    private readonly emailService;
    constructor(options: EmailConsumerOptions);
    /**
     * Process an email job
     */
    process(job: IJob<EmailJobData>): Promise<JobResult>;
    /**
     * Handle verification email job
     */
    private handleVerificationEmail;
}
/**
 * Create email job consumer (Factory Pattern)
 */
export declare const createEmailJobConsumer: (options: EmailConsumerOptions) => ((job: IJob<EmailJobData>) => Promise<JobResult>);
export { EmailConsumer };
//# sourceMappingURL=email.consumer.d.ts.map