/**
 * @auth/contracts - Worker Service Interface
 *
 * Main worker service interface for background job processing.
 */

import type { ILogger } from "../core/index.js";
import type { IRedisConnection } from "../core/index.js";
import type { IDatabaseService } from "../services/database.service.js";
import type { ISentry } from "./sentry.interface.js";
import type { IQueueProcessor, ProcessorRegistrationConfig, ProcessorHealth, WorkerMetrics } from "./processor.interface.js";

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
// Worker Health
// =============================================================================

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
