/**
 * @auth/contracts - Queue Processor Interface
 *
 * Types for queue processor configuration and health.
 */

import type { ILogger } from "../core/index.js";
import type { IRedisConnection } from "../core/index.js";
import type { IHealthResult } from "../common/index.js";
import type { IConsumer, IJob } from "./consumer.interface.js";
import type { ISentry } from "./sentry.interface.js";

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
// Processor Health
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
