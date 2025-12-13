/**
 * @auth/contracts - Worker Module Barrel Export
 *
 * Re-exports all worker types for background job processing.
 */

// Sentry integration
export type { ISentry } from "./sentry.interface.js";

// Consumer types
export type {
    IConsumer,
    ConsumerOptions,
    JobData,
    TraceContext,
    IJob,
    JobResult,
} from "./consumer.interface.js";

// Processor types
export type {
    IQueueProcessor,
    ProcessorConfig,
    ProcessorHealth,
    QueueProcessorOptions,
    ProcessorRegistrationConfig,
    WorkerConfig,
    WorkerMetrics,
} from "./processor.interface.js";

// Worker service
export type {
    IWorkerService,
    WorkerServiceOptions,
    WorkerHealth,
} from "./worker.interface.js";
