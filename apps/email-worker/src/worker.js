import {
  logger,
  redisClient,
  systemT,
  UnknownJobTypeError,
  InvalidJobDataError,
  EmailDispatchError,
  QUEUE_NAMES,
  EMAIL_JOB_TYPES,
} from "@auth/core";
import emailWorker from "./features/queue/email.worker.js";

logger.info(systemT("worker:logs.starting"));

// By importing the worker, its instance is created and it starts listening for jobs.
// We keep the process alive by listening for the 'ready' event on the redis client.
redisClient.on("ready", () => {
  logger.info(systemT("worker:logs.ready"));
});
