/**
 * @auth/contracts - Worker Service Interfaces
 *
 * Defines contracts for background job processing with BullMQ workers,
 * including consumers, processors, and health monitoring.
 */

import type { ILogger } from "./ILogger.js";
import type { IRedisConnection } from "./IRedisConnection.js";
import type { IDatabaseService } from "./services/database.service.js";
import type { IHealthResult } from "./common.js";

// =============================================================================
// Sentry Integration
// =============================================================================

/**
 * Sentry error tracking interface.
 * Minimal interface for error reporting in workers.
 */
export interface ISentry {
    /**
     * Capture and report an exception.
     * @param error - The error to report
     * @param context - Optional additional context
     */
    captureException(error: Error, context?: Readonly<Record<string, unknown>>): void;

    /**
     * Capture and report a message.
     * @param message - The message to report
     * @param options - Optional level and extra data
     */
    captureMessage(
        message: string,
        options?: {
            readonly level?: string;
            readonly extra?: Readonly<Record<string, unknown>>;
        }
    ): void;
}

// =============================================================================
// Consumer Types
// =============================================================================

/**
 * Consumer initialization options.
 */
export interface ConsumerOptions {
    /** Name of the consumer for logging */
    readonly name: string;
    /** Logger instance */
    readonly logger: ILogger;
}

/**
 * Job data payload - generic key-value structure.
 */
export interface JobData {
    readonly [key: string]: unknown;
}

/**
 * Trace context for distributed tracing.
 * Matches OpenTelemetry SpanContext structure.
 */
export interface TraceContext {
    /** Trace ID for correlating spans across services */
    readonly traceId: string;
    /** Span ID for this specific operation */
    readonly spanId: string;
    /** Trace flags (e.g., sampled flag) */
    readonly traceFlags: number;
}

/**
 * Job interface for consumers.
 * @template T - Type of the job data payload
 */
export interface IJob<T = JobData> {
    /** Unique job identifier */
    readonly id: string;
    /** Job name/type */
    readonly name: string;
    /** Job data payload */
    readonly data: T;
    /** Number of retry attempts made */
    readonly attemptsMade: number;
    /** Job options (priority, delay, etc.) */
    readonly opts: Readonly<Record<string, unknown>>;
}

/**
 * Result returned after processing a job.
 */
export interface JobResult {
    /** Whether the job completed successfully */
    readonly success: boolean;
    /** Optional message describing the result */
    readonly message?: string | undefined;
    /** Optional additional data from processing */
    readonly data?: Readonly<Record<string, unknown>> | undefined;
}

/**
 * Base consumer interface for job handlers.
 */
export interface IConsumer {
    /** Consumer name for identification */
    readonly name: string;

    /**
     * Process a job.
     * @param job - The job to process
     * @returns Result of processing
     */
    process(job: IJob): Promise<JobResult>;
}

// =============================================================================
// Worker Configuration
// =============================================================================

/**
 * Configuration options for worker instances.
 */
export interface WorkerConfig {
    /** Number of concurrent jobs to process */
    readonly concurrency?: number | undefined;
    /** Auto-remove completed jobs (count to keep) */
    readonly removeOnComplete?: { readonly count: number } | undefined;
    /** Auto-remove failed jobs (count to keep) */
    readonly removeOnFail?: { readonly count: number } | undefined;
    /** Rate limiting configuration */
    readonly limiter?: { readonly max: number; readonly duration: number } | undefined;
    /** Interval for checking stalled jobs (ms) */
    readonly stalledInterval?: number | undefined;
    /** Maximum lock duration for a job (ms) */
    readonly lockDuration?: number | undefined;
    /** Delay before draining (ms) */
    readonly drainDelay?: number | undefined;
    /** Maximum retry attempts */
    readonly attempts?: number | undefined;
    /** Backoff strategy for retries */
    readonly backoff?: { readonly type: string; readonly delay: number } | undefined;
    /** Disable stalled job checking (for testing) */
    readonly disableStalledJobCheck?: boolean | undefined;
}

/**
 * Processor configuration for a queue.
 */
export interface ProcessorConfig {
    /** Name of the queue to process */
    readonly queueName: string;
    /** Consumer instance to handle jobs */
    readonly consumer: IConsumer;
    /** Optional concurrency override */
    readonly concurrency?: number | undefined;
}

// =============================================================================
// Worker Service Options
// =============================================================================

/**
 * Options for initializing a WorkerService.
 */
export interface WorkerServiceOptions {
    /** Logger instance */
    readonly logger: ILogger;
    /** Redis connection for BullMQ */
    readonly redisConnection: IRedisConnection;
    /** Optional Sentry instance for error tracking */
    readonly sentry?: ISentry | undefined;
    /** Optional Sentry DSN for initialization */
    readonly sentryDsn?: string | undefined;
    /** Environment name (development, production, etc.) */
    readonly environment?: string | undefined;
    /** Optional database service for job processing */
    readonly databaseService?: IDatabaseService | undefined;
    /** Services to initialize before starting workers */
    readonly initServices?: Array<() => Promise<void>> | undefined;
    /** Optional i18n translation function */
    readonly t?: (key: string, params?: Readonly<Record<string, unknown>>) => string;
}

// =============================================================================
// Queue Processor Options
// =============================================================================

/**
 * Options for creating a queue processor.
 */
export interface QueueProcessorOptions {
    /** Name of the queue to process */
    readonly queueName: string;
    /** Redis connection for BullMQ */
    readonly connection: IRedisConnection;
    /** Job processor function */
    readonly processor: (job: IJob) => Promise<unknown>;
    /** Logger instance */
    readonly logger: ILogger;
    /** Optional i18n translation function */
    readonly t?: (key: string, params?: Readonly<Record<string, unknown>>) => string;
    /** Optional Sentry instance for error tracking */
    readonly sentry?: ISentry | undefined;
    /** Worker configuration */
    readonly workerConfig?: WorkerConfig | undefined;
    /** Dead letter queue for failed jobs */
    readonly deadLetterQueueName?: string | undefined;
}

/**
 * Configuration for registering a processor.
 * @template T - Type of the job data payload
 */
export interface ProcessorRegistrationConfig<T = unknown> {
    /** Name of the queue to process */
    readonly queueName: string;
    /** Job processor function */
    readonly processor: (job: IJob<T>) => Promise<unknown>;
    /** Worker configuration */
    readonly workerConfig?: WorkerConfig | undefined;
    /** Dead letter queue for failed jobs */
    readonly deadLetterQueueName?: string | undefined;
}

// =============================================================================
// Worker Health & Metrics
// =============================================================================

/**
 * Health status for a queue processor.
 */
export interface ProcessorHealth extends IHealthResult {
    /** Queue name this processor handles */
    readonly queueName: string;
    /** Whether the worker is running */
    readonly isRunning?: boolean | undefined;
    /** Whether the worker is paused */
    readonly isPaused?: boolean | undefined;
    /** Reason for unhealthy status */
    readonly reason?: string | undefined;
}

/**
 * Overall worker service health.
 */
export interface WorkerHealth {
    /** Whether the overall service is healthy */
    readonly healthy: boolean;
    /** Health status of each processor */
    readonly processors: readonly ProcessorHealth[];
    /** Database health (null if not configured) */
    readonly database: { readonly healthy: boolean } | null;
}

/**
 * Metrics for a worker's job processing.
 * Note: Properties are mutable as this is used for internal state tracking.
 */
export interface WorkerMetrics {
    /** Total jobs processed (attempted) */
    processed: number;
    /** Successfully completed jobs */
    completed: number;
    /** Failed jobs */
    failed: number;
    /** Currently active jobs */
    active: number;
    /** Total processing time in milliseconds */
    totalProcessingTime: number;
    /** Timestamp of last processed job */
    lastProcessedAt: Date | null;
    /** Average processing time in milliseconds */
    averageProcessingTime?: number | undefined;
    /** Success rate as a decimal (0-1) */
    successRate?: number | undefined;
    /** Failure rate as a decimal (0-1) */
    failureRate?: number | undefined;
}

// =============================================================================
// Worker Service Interface
// =============================================================================

/**
 * Interface for background job processing service.
 *
 * Manages multiple queue processors, handles job routing,
 * and provides health monitoring and metrics.
 *
 * @example
 * ```typescript
 * const processor = workerService.registerProcessor({
 *   queueName: 'email',
 *   processor: async (job) => {
 *     await sendEmail(job.data);
 *     return { success: true };
 *   },
 * });
 *
 * await workerService.start();
 * ```
 */
export interface IWorkerService {
    /**
     * Register a processor for a queue.
     * @template T - Type of the job data payload
     * @param config - Processor registration configuration
     * @returns The created queue processor
     */
    registerProcessor<T = unknown>(config: ProcessorRegistrationConfig<T>): IQueueProcessor;

    /**
     * Start all registered processors.
     */
    start(): Promise<void>;

    /**
     * Stop all processors gracefully.
     * @param timeoutMs - Maximum time to wait for graceful shutdown
     */
    stop(timeoutMs?: number): Promise<void>;

    /**
     * Get health status of all processors.
     */
    getHealth(): Promise<WorkerHealth>;

    /**
     * Get metrics for all processors.
     */
    getMetrics(): ReadonlyArray<{ readonly queueName: string; readonly metrics: WorkerMetrics }>;

    /**
     * Pause all processors.
     */
    pauseAll(): Promise<void>;

    /**
     * Resume all processors.
     */
    resumeAll(): Promise<void>;

    /**
     * Get all registered processors.
     */
    getProcessors(): readonly IQueueProcessor[];
}

// =============================================================================
// Queue Processor Interface
// =============================================================================

/**
 * Interface for a single queue processor.
 */
export interface IQueueProcessor {
    /** Name of the queue this processor handles */
    readonly queueName: string;

    /**
     * Initialize the processor (create BullMQ worker).
     */
    initialize(): Promise<void>;

    /**
     * Close the processor gracefully.
     */
    close(): Promise<void>;

    /**
     * Pause job processing.
     */
    pause(): Promise<void>;

    /**
     * Resume job processing.
     */
    resume(): Promise<void>;

    /**
     * Get health status of this processor.
     */
    getHealth(): Promise<ProcessorHealth>;

    /**
     * Get metrics for this processor.
     */
    getMetrics(): WorkerMetrics;
}
