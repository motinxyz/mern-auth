import { Queue } from "bullmq";
import baseLogger from "../../config/logger.js";
import redisClient from "../../startup/redisClient.js";
import { t as systemT } from "../../config/system-logger.js";
import { QueueError, JobCreationError } from "../../errors/index.js";
import { QUEUE_NAMES } from "./queue.constants.js";

const queueLogger = baseLogger.child({ module: "queue-service" });

const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // Start with a 5-second delay, then 10s, 20s
    },
  },
});

emailQueue.on("error", (err) => {
  // Log the asynchronous queue error for immediate visibility.
  queueLogger.error({ err }, systemT("queue:queueError"));

  // Throw a structured error to signal a critical failure. This will be caught
  // by the process-wide 'uncaughtException' handler, which will terminate the process.
  throw new QueueError(err);
});

export const addEmailJob = async (type, data) => {
  queueLogger.info({ job: { type, data } }, systemT("queue:addingJob"));
  try {
    // The job name is the first argument, data is the second
    const job = await emailQueue.add(type, { type, data });
    return job;
  } catch (error) {
    queueLogger.error(
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
