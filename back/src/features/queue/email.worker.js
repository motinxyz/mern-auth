import { Worker } from "bullmq";
import logger from "../../config/logger.js";
import redisClient from "../../startup/redisClient.js";
import { sendVerificationEmail } from "../email/email.service.js";
import { QUEUE_NAMES, EMAIL_JOB_TYPES } from "./queue.constants.js";
import {
  UnknownJobTypeError,
  InvalidJobDataError,
  EmailDispatchError,
} from "../../errors/index.js";
import { getTranslator } from "../../config/i18n.js";

// Initialize a system translator for worker-level logs and messages.
const systemT = await getTranslator("en");

/**
 * Processes jobs from the email queue.
 * It identifies the job type and calls the appropriate email service.
 * @param {import("bullmq").Job} job - The job object from the queue.
 * @returns {Promise<object>} A promise that resolves with a status message.
 */
const processor = async (job) => {
  const { type, data } = job.data;
  workerLogger.info(
    { job: { id: job.id, type } },
    systemT("worker:logs.processing")
  );

  switch (type) {
    case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL: {
      // By wrapping the case in curly braces, we create a new block scope,
      // Basic validation for the job data payload.
      if (!data.user || !data.token || !data.locale) {
        throw new InvalidJobDataError(
          systemT("worker:errors.jobDataMissingFields"),
          [
            !data.user && { field: "user", message: "is required" },
            !data.token && { field: "token", message: "is required" },
            !data.locale && { field: "locale", message: "is required" },
          ]
        );
      }

      // which resolves the `no-case-declarations` ESLint error.
      /** @type {Function} */
      const t = await getTranslator(data.locale || "en");
      // Call the email service with the user, token, and translation function.
      try {
        await sendVerificationEmail(data.user, data.token, t);
      } catch (error) {
        throw new EmailDispatchError(
          systemT("email:errors.dispatchFailed"),
          error
        );
      }
      return { status: "OK", message: systemT("worker:logs.emailSentSuccess") };
    }
    // Add other email types here
    // case "sendPasswordResetEmail":
    //   ...
    default:
      // Throw a custom error for unknown job types
      throw new UnknownJobTypeError(
        systemT("worker:errors.unknownJobType", { type }),
        type
      );
  }
};

const workerLogger = logger.child({ module: "email-worker" });
const worker = new Worker(QUEUE_NAMES.EMAIL, processor, {
  connection: redisClient,
  concurrency: 5, // Process up to 5 jobs at once
  // Add a custom error handler for the worker to centralize error logging
  // This will catch errors thrown by the processor function
  errorHandler: (err, job) => {
    workerLogger.error(
      { job: { id: job?.id, type: job?.data?.type }, err },
      `${systemT("worker:logs.failed")}: ${err.message}`
    );
  },
});

worker.on("completed", (job, result) => {
  workerLogger.info(
    { job: { id: job.id }, result },
    systemT("worker:logs.completed")
  );
});

worker.on("failed", (job, err) => {
  // The errorHandler above will handle most errors from the processor.
  // This 'failed' event listener can still be useful for errors not caught by the errorHandler,
  // or for additional logging/metrics.
  // For now, we'll keep it consistent with the errorHandler's logging.
  workerLogger.error(
    { job: { id: job.id, type: job.data?.type }, err },
    `${systemT("worker:logs.failed")}: ${err.message}`
  );
});

export default worker;
