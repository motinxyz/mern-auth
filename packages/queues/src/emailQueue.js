import { Queue } from "bullmq";
import connection from "./connection.js";
import { logger as baseLogger, t as systemT } from "@auth/config"; // Use baseLogger and systemT
import { QUEUE_NAMES } from "./queue.constants.js";
import { QueueError, JobCreationError } from "@auth/utils"; // Import necessary errors

const queueLogger = baseLogger.child({ module: "queue-service" }); // Define queueLogger

const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
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

export default emailQueue;
