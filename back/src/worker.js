import "./config/env.js"; // Ensure environment variables are loaded first
import logger from "./config/logger.js";
import redisClient from "./startup/redisClient.js";
import { getTranslator } from "./config/i18n.js";
import emailWorker from "./features/queue/email.worker.js";

// Initialize a system translator for worker-level logs and messages.
const systemT = await getTranslator("en");

logger.info(systemT("worker:startingWorker"));

// By importing the worker, its instance is created and it starts listening for jobs.
// We keep the process alive by listening for the 'ready' event on the redis client.
redisClient.on("ready", () => {
  logger.info(systemT("worker:workerReady"));
});
