import { Worker } from "bullmq";
import {
  logger,
  redisClient,
  systemT,
  addEmailJob,
  QUEUE_NAMES,
} from "@auth/core";

const retryWorkerLogger = logger.child({ module: "retry-worker" });

// How long to wait before retrying a failed job (e.g., 5 minutes)
const RETRY_DELAY_MS = 5 * 60 * 1000;

/**
 * This processor doesn't *do* the job, it just moves it back to the main queue.
 * @param {import("bullmq").Job} job The job object from the dead-letter queue.
 */
const processor = async (job) => {
  retryWorkerLogger.info(
    { job: { id: job.id, name: job.name } },
    `Retrying job from dead-letter queue. Moving back to main email queue with a ${RETRY_DELAY_MS}ms delay.`
  );

  // Re-queue the job in the main email queue with a delay
  await addEmailJob(job.data.type, job.data.data);

  return {
    status: "OK",
    message: `Job ${job.id} re-queued for processing.`,
  };
};

const worker = new Worker(QUEUE_NAMES.EMAIL_DEAD_LETTER, processor, {
  connection: redisClient,
  concurrency: 5, // Can be low, as it's a simple operation
  // Automatically remove completed jobs from the DLQ
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
});

worker.on("failed", (job, err) => {
  retryWorkerLogger.error({ job, err }, "Failed to re-queue job from DLQ.");
});

export default worker;