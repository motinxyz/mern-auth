import { Worker } from "bullmq";
import type { ILogger, IJob, ISentry, WorkerConfig, WorkerMetrics, IQueueProcessor } from "@auth/contracts";
/**
 * Queue processor options
 */
interface QueueProcessorServiceOptions {
    queueName: string;
    connection: unknown;
    processor: (job: IJob) => Promise<unknown>;
    logger: ILogger;
    sentry?: ISentry;
    workerConfig?: WorkerConfig;
    deadLetterQueueName?: string;
}
/**
 * Generic Queue Processor Service
 * Handles any BullMQ job processing with metrics and health checks
 */
declare class QueueProcessorService implements IQueueProcessor {
    readonly queueName: string;
    private readonly connection;
    private readonly processorFn;
    private readonly logger;
    private readonly workerConfig;
    private readonly deadLetterQueueName;
    private readonly sentry;
    private worker;
    private deadLetterQueue;
    private metrics;
    constructor(options: QueueProcessorServiceOptions);
    /**
     * Get default worker configuration
     */
    private getDefaultConfig;
    /**
     * Initialize the queue processor
     */
    initialize(): Promise<void>;
    /**
     * Setup event handlers for the worker
     */
    private setupEventHandlers;
    /**
     * Get processor metrics
     */
    getMetrics(): WorkerMetrics;
    /**
     * Get health status
     */
    getHealth(): Promise<{
        healthy: boolean;
        queueName?: string;
        isRunning?: boolean;
        isPaused?: boolean;
        reason?: string;
        metrics?: WorkerMetrics;
    }>;
    /**
     * Pause the worker
     */
    pause(): Promise<void>;
    /**
     * Resume the worker
     */
    resume(): Promise<void>;
    /**
     * Close the worker gracefully
     */
    close(): Promise<void>;
    /**
     * Get worker instance
     */
    getWorker(): Worker | null;
}
export default QueueProcessorService;
//# sourceMappingURL=queue-processor.service.d.ts.map