import { Queue } from "bullmq";
import logger from "../../config/logger.js";
import redisClient from "../../startup/redisClient.js";

import { QUEUE_NAMES } from "./queue.constants.js";
import { getTranslator } from "../../config/i18n.js";
import { QueueError } from "../../errors/index.js";
import { JobCreationError } from "../../errors/index.js";
const queueLogger = logger.child({ module: "queue-service" });

// Initialize a system translator for queue-level logs and messages.
const systemT = await getTranslator("en");

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
      systemT("common:errors.jobCreationFailed")
    );
    // Wrap the original error in our custom error class for better context.
    throw new JobCreationError(
      systemT("common:errors.jobCreationFailed"),
      error
    );
  }
};
