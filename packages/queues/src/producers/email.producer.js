import emailQueue from "../email.queue.js";
import { logger as baseLogger, t as systemT } from "@auth/config";
import { JobCreationError } from "@auth/utils";

const producerLogger = baseLogger.child({ module: "email-producer" });

/**
 * Adds an email job to the queue with optional custom options.
 *
 * @param {string} type - The job type (e.g., SEND_VERIFICATION_EMAIL)
 * @param {object} data - The job data payload
 * @param {object} [customOptions={}] - Optional BullMQ job options (e.g., jobId for deduplication)
 * @returns {Promise<Job>} The created job
 */
export const addEmailJob = async (type, data, customOptions = {}) => {
  producerLogger.info({ job: { type, data } }, systemT("queue:addingJob"));
  try {
    // Merge custom options with default options
    // Custom options take precedence (e.g., jobId for deduplication)
    const jobOptions = {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      ...customOptions, // Custom options override defaults
    };

    const job = await emailQueue.add(type, { type, data }, jobOptions);

    if (customOptions.jobId) {
      producerLogger.debug(
        { jobId: customOptions.jobId, type },
        "Job added with deterministic ID for deduplication"
      );
    }

    return job;
  } catch (error) {
    producerLogger.error(
      { err: error, jobData: data },
      systemT("queue:errors.jobCreationFailed")
    );
    // Wrap the original error in our custom error class for better context.
    throw new JobCreationError(
      systemT("queue:errors.jobCreationFailed"),
      error
    );
  }
};
