import emailQueue from "../email.queue.js";
import { logger as baseLogger, t as systemT } from "@auth/config";
import { JobCreationError } from "@auth/utils";

const producerLogger = baseLogger.child({ module: "email-producer" });

export const addEmailJob = async (type, data) => {
  producerLogger.info({ job: { type, data } }, systemT("queue:addingJob"));
  try {
    // The job name is the first argument, data is the second
    const job = await emailQueue.add(type, { type, data });
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
