import { Worker, Queue } from "bullmq";
import { logger, redisClient, systemT, i18nInstance, UnknownJobTypeError, InvalidJobDataError, EmailDispatchError, QUEUE_NAMES, EMAIL_JOB_TYPES } from "@auth/core";
import { sendVerificationEmail } from "../email/email.service.js";

const failedJobsQueue = new Queue(QUEUE_NAMES.EMAIL_DEAD_LETTER, { connection: redisClient });

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

      const t = await i18nInstance.getFixedT(data.locale || "en");
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
    default:
      throw new UnknownJobTypeError(
        systemT("worker:errors.unknownJobType", { type }),
        type
      );
  }
};

const workerLogger = logger.child({ module: "email-worker" });
const worker = new Worker(QUEUE_NAMES.EMAIL, processor, {
  connection: redisClient,
  concurrency: 5,
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
  limiter: {
    max: 100,
    duration: 1000 * 60, // 100 jobs per minute
  },
  errorHandler: async (err, job) => {
    workerLogger.error(
      { job: { id: job?.id, type: job?.data?.type }, err },
      `${systemT("worker:logs.failed")}: ${err.message}`
    );
    // Move failed job to the dead-letter queue
    await failedJobsQueue.add(job.name, job.data, { lifo: true });
  },
});

worker.on("completed", (job, result) => {
  workerLogger.info(
    { job: { id: job.id }, result },
    systemT("worker:logs.completed")
  );
});

export default worker;
