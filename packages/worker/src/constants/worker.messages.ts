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

// Job Processing Messages
export const WORKER_MESSAGES = {
  // Job Lifecycle
  JOB_PROCESSING: "Processing job",
  JOB_COMPLETED: "Job completed successfully",
  JOB_FAILED: "Job failed",
  JOB_STALLED: "Job stalled",
  JOB_PROGRESS: "Job progress updated",
  JOB_MOVED_TO_DLQ: "Job moved to dead-letter queue after max retries",

  // Worker Lifecycle
  WORKER_STARTING: "Starting email worker process...",
  WORKER_READY: "Worker ready for queue",
  WORKER_ERROR: "Worker error occurred",
  WORKER_PAUSED: "Worker paused for queue",
  WORKER_RESUMED: "Worker resumed for queue",
  WORKER_SERVICE_READY: "Worker service ready with {count} processor(s)",
  WORKER_SERVICE_STOPPED: "Worker service stopped",
  WORKER_SHUTTING_DOWN: "Shutting down worker service...",
  ALL_PROCESSORS_PAUSED: "All processors paused",
  ALL_PROCESSORS_RESUMED: "All processors resumed",

  // Processor Lifecycle
  PROCESSOR_INITIALIZED: "Queue processor initialized for",
  PROCESSOR_CLOSED: "Queue processor closed for",

  // Email Consumer
  EMAIL_JOB_STARTED: "Job started",
  EMAIL_SENDING_VERIFICATION: "Sending verification email",
  EMAIL_VERIFICATION_SENT: "Verification email sent",
  EMAIL_SENT_SUCCESS: "Email sent successfully",

  // Graceful Shutdown & Drain Mode
  ALL_JOBS_COMPLETED: "All in-flight jobs completed",
  DRAIN_MODE_ENTERING: "Entering drain mode - no new jobs will be accepted",
  DRAIN_MODE_EXITING: "Exiting drain mode - resuming job processing",
  SHUTDOWN_TIMEOUT: "Graceful shutdown timeout reached - forcing close",
};

// Worker Error Messages
export const WORKER_ERRORS = {
  MISSING_CONFIG: "{config} is required for QueueProcessorService",
  EMAIL_SERVICE_REQUIRED:
    "EmailService is required to create email job consumer",
  JOB_DATA_MISSING_FIELDS: "Job data is missing required fields",
  UNKNOWN_JOB_TYPE: "Unknown job type received: {type}",
  JOB_FAILED: "Job processing failed",
  STARTUP_FAILED: "Email worker startup failed",
  SHUTDOWN_ERROR: "Error during graceful shutdown",
  EMAIL_DISPATCH_FAILED: "Email dispatch failed",
};
