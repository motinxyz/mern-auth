import { Worker, Queue } from "bullmq";
import type { ILogger } from "@auth/contracts";
/**
 * Generic Queue Processor Service
 * Handles any BullMQ job processing with metrics and health checks
 */
declare class QueueProcessorService {
    queueName: string;
    connection: any;
    processor: any;
    logger: ILogger;
    workerConfig: any;
    deadLetterQueueName: string | undefined;
    sentry: any;
    worker: Worker | null;
    deadLetterQueue: Queue | null;
    metrics: {
        processed: number;
        completed: number;
        failed: number;
        active: number;
        totalProcessingTime: number;
        lastProcessedAt: Date | null;
    };
    constructor(options?: any);
    /**
     * Get default worker configuration
     */
    getDefaultConfig(): {
        concurrency: number;
        removeOnComplete: {
            count: number;
        };
        removeOnFail: {
            count: number;
        };
        limiter: {
            max: number;
            duration: number;
        };
        stalledInterval: number;
        lockDuration: number;
        drainDelay: number;
        attempts: number;
        backoff: {
            type: string;
            delay: number;
        };
        disableStalledJobCheck: boolean;
    };
    /**
     * Initialize the queue processor
     */
    initialize(): Promise<void>;
    /**
     * Setup event handlers for the worker
     */
    setupEventHandlers(): void;
    /**
     * Get processor metrics
     */
    getMetrics(): {
        averageProcessingTime: number;
        successRate: number;
        failureRate: number;
        processed: number;
        completed: number;
        failed: number;
        active: number;
        totalProcessingTime: number;
        lastProcessedAt: Date | null;
    };
    /**
     * Get health status
     */
    getHealth(): Promise<{
        healthy: boolean;
        queueName: string;
        isRunning: boolean;
        isPaused: boolean;
        metrics: {
            averageProcessingTime: number;
            successRate: number;
            failureRate: number;
            processed: number;
            completed: number;
            failed: number;
            active: number;
            totalProcessingTime: number;
            lastProcessedAt: Date | null;
        };
        reason?: undefined;
    } | {
        healthy: boolean;
        reason: any;
        queueName?: undefined;
        isRunning?: undefined;
        isPaused?: undefined;
        metrics?: undefined;
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
    getWorker(): Worker<any, any, string>;
}
export default QueueProcessorService;
//# sourceMappingURL=queue-processor.service.d.ts.map