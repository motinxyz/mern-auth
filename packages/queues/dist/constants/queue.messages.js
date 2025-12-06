/**
 * Queue Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * These are NOT translated because they are dev-facing logs.
 */
export const QUEUE_MESSAGES = {
    // Job Messages
    ADDING_JOB: "Adding job to queue",
    JOB_ADDED: "Job added successfully",
    JOB_WAITING: "Job waiting",
    DEDUPLICATION_JOB: "Job added with deterministic ID for deduplication",
    // Queue Lifecycle
    QUEUE_INITIALIZED: "Queue initialized",
    QUEUE_PAUSED: "Queue paused",
    QUEUE_RESUMED: "Queue resumed",
    QUEUE_CLOSED: "Queue closed",
    // Circuit Breaker
    CIRCUIT_BREAKER_OPEN: "Circuit breaker opened - Queue operations failing",
    CIRCUIT_BREAKER_CLOSED: "Circuit breaker closed - Queue operations restored",
    CIRCUIT_BREAKER_UNAVAILABLE: "Queue service temporarily unavailable. Please try again later.",
};
export const QUEUE_ERRORS = {
    MISSING_CONFIG: "{config} is required for QueueProducerService",
    JOB_CREATION_FAILED: "Job creation failed",
    QUEUE_ERROR: "Queue error occurred",
    QUEUE_NOT_INITIALIZED: "Queue not initialized. Call initialize() first.",
    PRODUCER_MISSING_QUEUE: "ProducerService requires 'queueService' option",
    PRODUCER_MISSING_LOGGER: "ProducerService requires 'logger' option",
    JOB_DATA_VALIDATION_FAILED: "Invalid job data - validation failed",
};
//# sourceMappingURL=queue.messages.js.map