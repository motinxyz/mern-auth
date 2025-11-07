import { Queue } from "bullmq";
import { redisConnection as connection } from "@auth/config/redis";
import { logger as baseLogger, t as systemT } from "@auth/config";
import { QUEUE_NAMES } from "./queue.constants.js";
import { QueueError } from "@auth/utils";

const queueLogger = baseLogger.child({ module: "queue-service" });

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
  queueLogger.error({ err }, systemT("queue:queueError"));
  throw new QueueError(err);
});

export default emailQueue;
