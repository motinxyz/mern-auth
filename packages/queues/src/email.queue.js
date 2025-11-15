import { Queue } from "bullmq";
import { redisConnection as connection } from "@auth/config";
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
  // Reduce Redis chattiness for providers with strict request limits like Upstash
  enableReadyEvent: false, // Disable ready event if not explicitly needed
  enableKeyEvents: false, // Disable key events if not explicitly needed
});

emailQueue.on("error", (err) => {
  queueLogger.error({ err }, systemT("queue:queueError"));
  throw new QueueError(err);
});

export default emailQueue;
