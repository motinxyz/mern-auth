
import { Worker, Queue } from "bullmq";
import {
  redisConnection as connection,
  QUEUE_NAMES,
  WORKER_CONFIG,
} from "@auth/queues";
import { logger, t as systemT } from "@auth/config";
import { emailJobConsumer } from "./consumers/email.consumer.js";

const failedJobsQueue = new Queue(QUEUE_NAMES.EMAIL_DEAD_LETTER, { connection });
const workerLogger = logger.child({ module: "email-processor" }); // Changed module name for logger

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
