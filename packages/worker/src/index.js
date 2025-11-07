import { logger, t } from "@auth/config";
import emailProcessor from "./email.processor.js";
import { redisConnection } from "@auth/queues";

logger.info(t("worker:logs.starting"));

emailProcessor.on("ready", () => {
  logger.info(t("worker:logs.ready"));
});

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully.`);
  await emailProcessor.close();
  await redisConnection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
