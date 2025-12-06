import { Queue } from "bullmq";
import type { ILogger } from "@auth/contracts";
/**
 * Queue Producer Service
 * Generic queue management for producing jobs with DI
 *
 * @implements {import('@auth/contracts').IQueueProducer}
 */
declare class QueueProducerService {
    queueName: string;
    connection: any;
    logger: ILogger;
    defaultJobOptions: any;
    jobSchema: any;
    enableCircuitBreaker: boolean;
    circuitBreakerTimeout: number;
    queue: Queue | null;
    circuitBreaker: any;
    constructor(options?: any);
    /**
     * Get default job options
     */
    getDefaultJobOptions(): {
        attempts: number;
        backoff: {
            type: string;
            delay: number;
        };
        removeOnComplete: {
            count: number;
        };
        removeOnFail: {
            count: number;
        };
    };
    /**
     * Initialize the queue
     */
    initialize(): Promise<void>;
    /**
     * Setup event handlers
     */
    setupEventHandlers(): void;
    /**
     * Add a job to the queue
     */
    addJob(jobName: string, data: any, customOptions?: any): Promise<any>;
    /**
     * Get queue metrics
     */
    getMetrics(): Promise<{
        queueName: string;
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        total: number;
    }>;
    /**
     * Get queue health with Redis latency
     */
    getHealth(): Promise<{
        healthy: boolean;
        queueName: string;
        redis: {
            connected: boolean;
            latencyMs: number;
        };
        metrics: {
            queueName: string;
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            total: number;
        };
        circuitBreaker: {
            state: string;
        };
        reason?: undefined;
    } | {
        healthy: boolean;
        reason: any;
        queueName?: undefined;
        redis?: undefined;
        metrics?: undefined;
        circuitBreaker?: undefined;
    }>;
    /**
     * Pause the queue
     */
    pause(): Promise<void>;
    /**
     * Resume the queue
     */
    resume(): Promise<void>;
    /**
     * Close the queue
     */
    close(): Promise<void>;
    /**
     * Get the underlying queue instance
     */
    getQueue(): Queue<any, any, string, any, any, string>;
}
export default QueueProducerService;
//# sourceMappingURL=queue-producer.service.d.ts.map