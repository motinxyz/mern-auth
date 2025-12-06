/**
 * Job options for queue operations
 */
export interface JobOptions {
    jobId?: string;
    delay?: number;
    attempts?: number;
    backoff?: {
        type: "fixed" | "exponential";
        delay: number;
    };
    priority?: number;
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
}

/**
 * Job result from queue
 */
export interface QueueJob {
    id: string;
    name: string;
    data: unknown;
    opts: JobOptions;
}

/**
 * Queue health status
 */
export interface QueueHealth {
    healthy: boolean;
    circuitBreaker?: {
        state: string;
        failures?: number;
    };
}

/**
 * IQueueProducer - Interface for queue operations
 *
 * Implementations: QueueProducerService (BullMQ)
 */
export interface IQueueProducer {
    /**
     * Add a job to the queue
     */
    addJob(type: string, data: unknown, options?: JobOptions): Promise<QueueJob>;

    /**
     * Get queue health status
     */
    getHealth(): Promise<QueueHealth>;
}
