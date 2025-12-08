/**
 * Backoff options for job retries
 */
export interface BackoffOptions {
    readonly type: "fixed" | "exponential";
    readonly delay: number;
}

/**
 * Job options for queue operations
 */
export interface JobOptions {
    readonly jobId?: string;
    readonly delay?: number;
    readonly attempts?: number;
    readonly backoff?: number | BackoffOptions;
    readonly priority?: number;
    readonly removeOnComplete?: boolean | number | { count: number };
    readonly removeOnFail?: boolean | number | { count: number };
}

/**
 * Job result from queue
 */
export interface QueueJob {
    readonly id?: string;
    readonly name: string;
    readonly data: unknown;
    readonly opts: JobOptions;
}

/**
 * Queue health status
 */
export interface QueueHealth {
    readonly healthy: boolean;
    readonly circuitBreaker?: {
        readonly state: string;
        readonly failures?: number;
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
