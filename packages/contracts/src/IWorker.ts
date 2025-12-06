import type { ILogger } from "./ILogger.js";

/**
 * Consumer options
 */
export interface ConsumerOptions {
    name: string;
    logger: ILogger;
}

/**
 * Job data for consumers
 */
export interface JobData {
    [key: string]: unknown;
}

/**
 * Job interface for consumers
 */
export interface IJob<T = JobData> {
    id: string;
    name: string;
    data: T;
    attemptsMade: number;
    opts: Record<string, unknown>;
}

/**
 * Job result
 */
export interface JobResult {
    success: boolean;
    message?: string;
    data?: Record<string, unknown>;
}

/**
 * Base consumer interface
 */
export interface IConsumer {
    readonly name: string;
    process(job: IJob): Promise<JobResult>;
}

/**
 * Worker processor config
 */
export interface ProcessorConfig {
    queueName: string;
    consumer: IConsumer;
    concurrency?: number;
}

/**
 * Worker service interface
 */
export interface IWorkerService {
    registerProcessor(config: ProcessorConfig): void;
    start(): Promise<void>;
    shutdown(): Promise<void>;
    getProcessorCount(): number;
}

/**
 * Queue processor interface
 */
export interface IQueueProcessor {
    start(): Promise<void>;
    shutdown(): Promise<void>;
    isRunning(): boolean;
}
