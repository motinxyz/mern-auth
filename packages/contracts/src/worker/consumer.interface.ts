/**
 * @auth/contracts - Consumer Interface
 *
 * Types for job consumers and job data processing.
 */

import type { ILogger } from "../core/index.js";

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
