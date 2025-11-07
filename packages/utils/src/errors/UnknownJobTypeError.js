/**
 * Custom error class for when a BullMQ worker receives a job with an unrecognized type.
 * This helps in distinguishing worker-specific errors from other application errors.
 */
export default class UnknownJobTypeError extends Error {
  constructor(message, jobType) {
    super(message);
    this.name = "UnknownJobTypeError";
    this.jobType = jobType; // Store the job type for easier debugging and logging.
  }
}
