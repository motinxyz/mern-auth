import QueueProcessorService from "./queue-processor.service.js";
/**
 * Worker Service
 * Generic orchestrator for any queue processors
 */
declare class WorkerService {
    sentry: any;
    logger: any;
    redisConnection: any;
    processors: any[];
    databaseService: any;
    initServices: any[];
    constructor(options?: any);
    /**
     * Register a queue processor
     * @param {Object} processorConfig - Configuration for the processor
     * @param {string} processorConfig.queueName - Name of the queue
     * @param {Function} processorConfig.processor - Job processor function
     * @param {Object} processorConfig.workerConfig - Worker configuration
     * @param {string} processorConfig.deadLetterQueueName - Dead letter queue name
     */
    registerProcessor(processorConfig: any): QueueProcessorService;
    /**
     * Start the worker service
     */
    start(): Promise<void>;
    /**
     * Stop the worker service gracefully
     * @param {number} timeoutMs - Maximum time to wait for jobs to complete (default: 30s)
     */
    stop(timeoutMs?: number): Promise<void>;
    /**
     * Drain mode - stop accepting new jobs but finish existing ones
     */
    drain(): Promise<void>;
    /**
     * Exit drain mode
     */
    undrain(): Promise<void>;
    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown(): void;
    /**
     * Get health status of all processors
     */
    getHealth(): Promise<{
        healthy: boolean;
        processors: any[];
        database: any;
    }>;
    /**
     * Get metrics from all processors
     */
    getMetrics(): {
        queueName: any;
        metrics: any;
    }[];
    /**
     * Pause all processors
     */
    pauseAll(): Promise<void>;
    /**
     * Resume all processors
     */
    resumeAll(): Promise<void>;
    /**
     * Get all processors
     */
    getProcessors(): any[];
    /**
     * Get database service instance
     */
    getDatabaseService(): any;
}
export default WorkerService;
//# sourceMappingURL=worker.service.d.ts.map