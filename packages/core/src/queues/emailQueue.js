
import { Queue } from "bullmq";
import connection from "./connection.js";
import logger from "../../config/logger.js";
import { QUEUE_NAMES } from "./queue.constants.js";

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
  logger.error({ err }, "Email queue error");
});

export default emailQueue;
