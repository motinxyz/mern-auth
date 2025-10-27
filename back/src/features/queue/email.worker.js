import { Worker } from "bullmq";
import logger from "../../config/logger.js";
import redisClient from "../../startup/redisClient.js";
import { sendVerificationEmail } from "../email/email.service.js"; // Assuming this is your email sending function
import { QUEUE_NAMES, EMAIL_JOB_TYPES } from "./queue.constants.js";
import {
  UnknownJobTypeError,
  InvalidJobDataError,
} from "../../errors/index.js"; // Import custom worker errors
import { getTranslator } from "../../config/i18n.js"; // Import the getTranslator function

const workerLogger = logger.child({ module: "email-worker" });

// Initialize a system translator for worker-level logs and messages.
const systemT = await getTranslator("en");

const processor = async (job) => {
  const { type, data } = job.data;
  workerLogger.info({ job: { id: job.id, type } }, systemT("worker:processingJob"));

  switch (type) {
    case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL: {
      // By wrapping the case in curly braces, we create a new block scope,
      // Basic validation for the job data payload.
      if (!data.user || !data.token || !data.locale) {
        throw new InvalidJobDataError(systemT("common:errors.jobDataMissingFields"), [
          !data.user && { field: "user", message: "is required" },
          !data.token && { field: "token", message: "is required" },
          !data.locale && { field: "locale", message: "is required" },
        ]);
      }

      // which resolves the `no-case-declarations` ESLint error.
      /** @type {Function} */
      const t = await getTranslator(data.locale || "en");
      // Call the email service with the user, token, and translation function.
      await sendVerificationEmail(data.user, data.token, t);
      return { status: "OK", message: systemT("worker:emailSentSuccess") };
    }
    // Add other email types here
    // case "sendPasswordResetEmail":
    //   ...
    default:
      // Throw a custom error for unknown job types
      throw new UnknownJobTypeError(systemT("common:errors.unknownJobType", { type }), type);
  }
};

const worker = new Worker(QUEUE_NAMES.EMAIL, processor, {
  connection: redisClient,
  concurrency: 5, // Process up to 5 jobs at once
  // Add a custom error handler for the worker to centralize error logging
  // This will catch errors thrown by the processor function
  errorHandler: (err, job) => {
    workerLogger.error({ job: { id: job?.id, type: job?.data?.type }, err }, `${systemT("worker:jobFailed")}: ${err.message}`);
  },
});

worker.on("completed", (job, result) => {
  workerLogger.info({ job: { id: job.id }, result }, systemT("worker:jobCompleted"));
});

worker.on("failed", (job, err) => {
  // The errorHandler above will handle most errors from the processor.
  // This 'failed' event listener can still be useful for errors not caught by the errorHandler,
  // or for additional logging/metrics.
  // For now, we'll keep it consistent with the errorHandler's logging.
  workerLogger.error({ job: { id: job.id, type: job.data?.type }, err }, `${systemT("worker:jobFailed")}: ${err.message}`);
});

export default worker;
