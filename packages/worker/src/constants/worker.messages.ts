/**
 * Worker Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * Uses `as const` for type safety.
 */

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
  WORKER_STARTED: "Worker started successfully",
  WORKER_STOPPING: "Stopping worker service...",
  WORKER_READY: "Worker ready for queue",
  WORKER_ERROR: "Worker error occurred",
  WORKER_PAUSED: "Worker paused for queue",
  WORKER_RESUMED: "Worker resumed for queue",
  WORKER_DRAINED: "Worker entering drain mode",
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
  SHUTDOWN_SIGNAL: "Received shutdown signal",
  WAITING_FOR_JOBS: "Waiting for active jobs to complete",
} as const;

export const WORKER_ERRORS = {
  MISSING_CONFIG: "{config} is required for QueueProcessorService",
  EMAIL_SERVICE_REQUIRED: "EmailService is required to create email job consumer",
  JOB_DATA_MISSING_FIELDS: "Job data is missing required fields",
  UNKNOWN_JOB_TYPE: "Unknown job type received: {type}",
  JOB_FAILED: "Job processing failed",
  STARTUP_FAILED: "Email worker startup failed",
  WORKER_START_FAILED: "Worker service failed to start",
  SHUTDOWN_ERROR: "Error during graceful shutdown",
  EMAIL_DISPATCH_FAILED: "Email dispatch failed",
} as const;
