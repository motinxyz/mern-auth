/**
 * Worker Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * These are NOT translated because:
 * 1. DevOps teams need consistent, searchable log messages across all environments
 * 2. Log aggregation tools (Datadog, Splunk) rely on pattern matching
 * 3. Stack Overflow and documentation use English error messages
 * 4. Distributed teams communicate in English
 *
 * For user-facing messages, use i18n translation keys instead.
 */
export declare const WORKER_MESSAGES: {
    JOB_PROCESSING: string;
    JOB_COMPLETED: string;
    JOB_FAILED: string;
    JOB_STALLED: string;
    JOB_PROGRESS: string;
    JOB_MOVED_TO_DLQ: string;
    WORKER_STARTING: string;
    WORKER_READY: string;
    WORKER_ERROR: string;
    WORKER_PAUSED: string;
    WORKER_RESUMED: string;
    WORKER_SERVICE_READY: string;
    WORKER_SERVICE_STOPPED: string;
    WORKER_SHUTTING_DOWN: string;
    ALL_PROCESSORS_PAUSED: string;
    ALL_PROCESSORS_RESUMED: string;
    PROCESSOR_INITIALIZED: string;
    PROCESSOR_CLOSED: string;
    EMAIL_JOB_STARTED: string;
    EMAIL_SENDING_VERIFICATION: string;
    EMAIL_VERIFICATION_SENT: string;
    EMAIL_SENT_SUCCESS: string;
    ALL_JOBS_COMPLETED: string;
    DRAIN_MODE_ENTERING: string;
    DRAIN_MODE_EXITING: string;
    SHUTDOWN_TIMEOUT: string;
};
export declare const WORKER_ERRORS: {
    MISSING_CONFIG: string;
    EMAIL_SERVICE_REQUIRED: string;
    JOB_DATA_MISSING_FIELDS: string;
    UNKNOWN_JOB_TYPE: string;
    JOB_FAILED: string;
    STARTUP_FAILED: string;
    SHUTDOWN_ERROR: string;
    EMAIL_DISPATCH_FAILED: string;
};
//# sourceMappingURL=worker.messages.d.ts.map