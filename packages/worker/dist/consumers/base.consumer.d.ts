import type { ILogger, IJob, JobResult, JobData } from "@auth/contracts";
interface BaseConsumerOptions {
    logger: ILogger;
    name?: string;
}
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
    protected readonly logger: ILogger;
    protected readonly name: string;
    constructor(options: BaseConsumerOptions);
    /**
     * Create a child logger with job context
     */
    protected createJobLogger(job: IJob, jobType: string): ILogger;
    /**
     * Wrap job processing in a span with trace context linking
     */
    protected withJobSpan<T extends JobData, R extends JobResult>(job: IJob<T>, spanName: string, processor: () => Promise<R>): Promise<R>;
    /**
     * Hash sensitive data for safe logging/tracing
     */
    protected hashSensitive(data: string): string;
    /**
     * Add custom span attributes
     */
    protected addAttributes(attributes: Record<string, string | number | boolean>): void;
}
export default BaseConsumer;
//# sourceMappingURL=base.consumer.d.ts.map