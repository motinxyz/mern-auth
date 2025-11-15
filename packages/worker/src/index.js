import { logger, t, initI18n } from "@auth/config";
import { redisConnection } from "@auth/config";
import { initEmailService } from "@auth/email";

await initI18n(); // Initialize i18n first
await initEmailService(); // Initialize email service

import emailProcessor from "./email.processor.js"; // Import after i18n is initialized

logger.info(t("worker:logs.starting"));

emailProcessor.on("ready", () => {
  logger.info(t("worker:logs.ready"));
});

async function gracefulShutdown(signal) {
  logger.info(t("system:process.shutdownSignal", { signal }));
  await emailProcessor.close();
  await redisConnection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
