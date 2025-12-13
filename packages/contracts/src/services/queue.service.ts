/**
 * @auth/contracts - Queue Producer Interface
 *
 * Defines contracts for queue operations with BullMQ.
 * Handles job submission with retry and backoff configurations.
 */

import type { IHealthResult } from "../common/index.js";

// =============================================================================
// Job Options
// =============================================================================

/**
 * Backoff configuration for job retries.
 */
export interface BackoffOptions {
    /** Backoff strategy type */
    readonly type: "fixed" | "exponential";
    /** Base delay in milliseconds */
    readonly delay: number;
}

/**
 * Options for adding a job to the queue.
 */
export interface JobOptions {
    /** Custom job ID (for idempotency) */
    readonly jobId?: string | undefined;
    /** Delay before processing in milliseconds */
    readonly delay?: number | undefined;
    /** Maximum retry attempts */
    readonly attempts?: number | undefined;
    /** Backoff configuration for retries */
    readonly backoff?: number | BackoffOptions | undefined;
    /** Job priority (lower = higher priority) */
    readonly priority?: number | undefined;
    /** Auto-remove completed jobs */
    readonly removeOnComplete?: boolean | number | { readonly count: number } | undefined;
    /** Auto-remove failed jobs */
    readonly removeOnFail?: boolean | number | { readonly count: number } | undefined;
}

// =============================================================================
// Job Result
// =============================================================================

/**
 * Job object returned after adding to queue.
 */
export interface QueueJob {
    /** Unique job ID (may be undefined if not yet assigned) */
    readonly id?: string | undefined;
    /** Job name/type */
    readonly name: string;
    /** Job data payload */
    readonly data: unknown;
    /** Job configuration options */
    readonly opts: Readonly<JobOptions>;
}

// =============================================================================
// Queue Health
// =============================================================================

/**
 * Queue producer health status.
 */
export interface QueueHealth extends IHealthResult {
    /** Circuit breaker status */
    readonly circuitBreaker?: {
        /** Current circuit breaker state */
        readonly state: string;
        /** Number of failures */
        readonly failures?: number | undefined;
    } | undefined;
}

// =============================================================================
// Queue Producer Interface
// =============================================================================

/**
 * Interface for queue producer operations.
 *
 * Provides job submission with configurable retries, delays, and priorities.
 * Implementations should use circuit breaker patterns for resilience.
 *
 * @example
 * ```typescript
 * const job = await queueProducer.addJob('send-email', {
 *   to: 'user@example.com',
 *   template: 'welcome',
 * }, {
 *   attempts: 3,
 *   backoff: { type: 'exponential', delay: 1000 },
 * });
 * ```
 */
export interface IQueueProducer {
    /**
     * Add a job to the queue.
     *
     * @param type - Job type/name
     * @param data - Job data payload
     * @param options - Optional job configuration
     * @returns The created job object
     */
    addJob(type: string, data: unknown, options?: JobOptions): Promise<QueueJob>;

    /**
     * Get queue health status.
     * @returns Health status including circuit breaker state
     */
    getHealth(): Promise<QueueHealth>;
}
