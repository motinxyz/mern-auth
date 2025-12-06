/**
 * Queue Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * These are NOT translated because they are dev-facing logs.
 */
export declare const QUEUE_MESSAGES: {
    ADDING_JOB: string;
    JOB_ADDED: string;
    JOB_WAITING: string;
    DEDUPLICATION_JOB: string;
    QUEUE_INITIALIZED: string;
    QUEUE_PAUSED: string;
    QUEUE_RESUMED: string;
    QUEUE_CLOSED: string;
    CIRCUIT_BREAKER_OPEN: string;
    CIRCUIT_BREAKER_CLOSED: string;
    CIRCUIT_BREAKER_UNAVAILABLE: string;
};
export declare const QUEUE_ERRORS: {
    MISSING_CONFIG: string;
    JOB_CREATION_FAILED: string;
    QUEUE_ERROR: string;
    QUEUE_NOT_INITIALIZED: string;
    PRODUCER_MISSING_QUEUE: string;
    PRODUCER_MISSING_LOGGER: string;
    JOB_DATA_VALIDATION_FAILED: string;
};
//# sourceMappingURL=queue.messages.d.ts.map