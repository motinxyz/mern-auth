import { Worker, Queue, Job } from "bullmq";

export interface ProcessorMetrics {
    processed: number;
    completed: number;
    failed: number;
    active: number;
    totalProcessingTime: number;
    lastProcessedAt: Date | null;
    averageProcessingTime: number;
    successRate: number;
    failureRate: number;
}

export interface ProcessorHealth {
    healthy: boolean;
    queueName?: string;
    isRunning?: boolean;
    isPaused?: boolean;
    metrics?: ProcessorMetrics;
    reason?: string;
}

export interface WorkerConfig {
    concurrency?: number;
    removeOnComplete?: { count: number };
    removeOnFail?: { count: number };
    limiter?: { max: number; duration: number };
    stalledInterval?: number;
    lockDuration?: number;
    drainDelay?: number;
    attempts?: number;
    backoff?: {
        type: "exponential" | "fixed";
        delay: number;
    };
}

export interface ProcessorConfig {
    queueName: string;
    processor: (job: Job) => Promise<any>;
    workerConfig?: WorkerConfig;
    deadLetterQueueName?: string;
}

export declare class QueueProcessorService {
    constructor(options: {
        queueName: string;
        connection: any;
        processor: (job: Job) => Promise<any>;
        logger: any;
        t: (key: string, options?: any) => string;
        workerConfig?: WorkerConfig;
        deadLetterQueueName?: string;
    });

    initialize(): Promise<void>;
    close(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    getMetrics(): ProcessorMetrics;
    getHealth(): Promise<ProcessorHealth>;
    getWorker(): Worker;
}

resumeAll(): Promise<void>;
getProcessors(): QueueProcessorService[];
getDatabaseService(): any;
}

export default WorkerService;
