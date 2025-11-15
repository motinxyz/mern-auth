
import { Worker, Queue } from "bullmq";
import { redisConnection as connection } from "@auth/config";
import { QUEUE_NAMES, WORKER_CONFIG } from "@auth/queues";
import { logger, t as systemT } from "@auth/config";
import { emailJobConsumer } from "./consumers/email.consumer.js";

const failedJobsQueue = new Queue(QUEUE_NAMES.EMAIL_DEAD_LETTER, { connection });
export const workerLogger = logger.child({ module: "email-processor" }); // Changed module name for logger

const processor = async (job) => {
  workerLogger.info(
    { job: { id: job.id, type: job.data.type } },
    systemT("worker:logs.processing")
  );
  return emailJobConsumer(job);
};

const emailProcessor = new Worker(QUEUE_NAMES.EMAIL, processor, {
  connection,
  concurrency: WORKER_CONFIG.CONCURRENCY,
  removeOnComplete: { count: WORKER_CONFIG.JOB_RETENTION.REMOVE_ON_COMPLETE_COUNT },
  removeOnFail: { count: WORKER_CONFIG.JOB_RETENTION.REMOVE_ON_FAIL_COUNT },
  limiter: {
    max: WORKER_CONFIG.RATE_LIMIT.MAX_JOBS,
    duration: WORKER_CONFIG.RATE_LIMIT.DURATION,
  },
  // Reduce Redis chattiness for providers with strict request limits like Upstash
  enableReadyEvent: false, // Disable ready event if not explicitly needed
  enableKeyEvents: false, // Disable key events if not explicitly needed
  // Further reduce Redis traffic by adjusting intervals and delays
  stalledInterval: 60000, // How often the worker checks for stalled jobs (default 30000ms)
  lockDuration: 60000,    // How long the job lock is valid (default 30000ms)
  drainDelay: 500,        // Delay before fetching next job after completion (default 5ms)
});

emailProcessor.on("failed", async (job, err) => {
  workerLogger.error(
    { job: { id: job?.id, type: job?.data?.type }, err },
    `${systemT("worker:logs.failed")}: ${err.message}`
  );
  // Move failed job to the dead-letter queue
  if (job) {
    await failedJobsQueue.add(job.name, job.data, { lifo: true });
  }
});

emailProcessor.on("completed", (job, result) => {
  workerLogger.info(
    { job: { id: job.id }, result },
    systemT("worker:logs.completed")
  );
});

emailProcessor.on("ready", () => {
  workerLogger.info("Email processor is ready for jobs."); // Changed log message
});

export default emailProcessor;
