import type { WorkerServiceOptions, ProcessorRegistrationConfig, IQueueProcessor, WorkerHealth, WorkerMetrics, IDatabaseService } from "@auth/contracts";
/**
 * Worker Service
 * Generic orchestrator for any queue processors
 */
declare class WorkerService {
    private readonly sentry;
    private readonly logger;
    private readonly redisConnection;
    private readonly processors;
    private readonly databaseService;
    private readonly initServices;
    constructor(options: WorkerServiceOptions);
    /**
     * Register a queue processor
     */
    registerProcessor(processorConfig: ProcessorRegistrationConfig): IQueueProcessor;
    /**
     * Start the worker service
     */
    start(): Promise<void>;
    /**
     * Stop the worker service gracefully
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
    getHealth(): Promise<WorkerHealth>;
    /**
     * Get metrics from all processors
     */
    getMetrics(): Array<{
        queueName: string;
        metrics: WorkerMetrics;
    }>;
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
    getProcessors(): IQueueProcessor[];
    /**
     * Get database service instance
     */
    getDatabaseService(): IDatabaseService | null;
}
export default WorkerService;
//# sourceMappingURL=worker.service.d.ts.map