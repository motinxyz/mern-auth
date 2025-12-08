import type { ILogger } from "./ILogger.js";
import type { IRedisConnection } from "./IRedisConnection.js";
import type { IDatabaseService } from "./IDatabase.js";

/**
 * Sentry integration interface
 */
export interface ISentry {
    captureException(error: Error, context?: Record<string, unknown>): void;
    captureMessage(
        message: string,
        options?: { level?: string; extra?: Record<string, unknown> }
    ): void;
}

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
 * Trace context for distributed tracing
 * Matches OpenTelemetry SpanContext structure
 */
export interface TraceContext {
    readonly traceId: string;
    readonly spanId: string;
    readonly traceFlags: number;
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
 * Worker configuration
 */
export interface WorkerConfig {
    concurrency?: number;
    removeOnComplete?: { count: number };
    removeOnFail?: { count: number };
    limiter?: { max: number; duration: number };
    stalledInterval?: number;
    lockDuration?: number;
    drainDelay?: number;
    attempts?: number;
    backoff?: { type: string; delay: number };
    disableStalledJobCheck?: boolean;
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
 * Worker service options
 */
export interface WorkerServiceOptions {
    logger: ILogger;
    /** Redis connection - must implement IRedisConnection (ioredis compatible) */
    redisConnection: IRedisConnection;
    sentry?: ISentry;
    sentryDsn?: string;
    environment?: string;
    databaseService?: IDatabaseService;
    initServices?: Array<() => Promise<void>>;
    t?: (key: string, params?: Record<string, unknown>) => string;
}

/**
 * Queue processor options
 */
export interface QueueProcessorOptions {
    queueName: string;
    connection: IRedisConnection;
    processor: (job: IJob) => Promise<unknown>;
    logger: ILogger;
    t?: (key: string, params?: Record<string, unknown>) => string;
    sentry?: ISentry;
    workerConfig?: WorkerConfig;
    deadLetterQueueName?: string;
}

/**
 * Processor registration config
 */
export interface ProcessorRegistrationConfig<T = unknown> {
    queueName: string;
    /** Job processor function - accepts generic job handler */
    processor: (job: IJob<T>) => Promise<unknown>;
    workerConfig?: WorkerConfig;
    deadLetterQueueName?: string;
}

/**
 * Worker health result
 */
export interface WorkerHealth {
    healthy: boolean;
    processors: Array<{
        healthy: boolean;
        queueName: string;
        isRunning?: boolean;
        isPaused?: boolean;
        reason?: string;
    }>;
    database: { healthy: boolean } | null;
}

/**
 * Worker metrics
 */
export interface WorkerMetrics {
    processed: number;
    completed: number;
    failed: number;
    active: number;
    totalProcessingTime: number;
    lastProcessedAt: Date | null;
    averageProcessingTime?: number;
    successRate?: number;
    failureRate?: number;
}

/**
 * Worker service interface
 */
export interface IWorkerService {
    registerProcessor<T = unknown>(config: ProcessorRegistrationConfig<T>): IQueueProcessor;
    start(): Promise<void>;
    stop(timeoutMs?: number): Promise<void>;
    getHealth(): Promise<WorkerHealth>;
    getMetrics(): Array<{ queueName: string; metrics: WorkerMetrics }>;
    pauseAll(): Promise<void>;
    resumeAll(): Promise<void>;
    getProcessors(): IQueueProcessor[];
}

/**
 * Queue processor interface
 */
export interface IQueueProcessor {
    readonly queueName: string;
    initialize(): Promise<void>;
    close(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    getHealth(): Promise<{
        healthy: boolean;
        queueName: string;
        isRunning?: boolean;
        isPaused?: boolean;
        reason?: string;
    }>;
    getMetrics(): WorkerMetrics;
}
