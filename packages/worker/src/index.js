import { logger, t, initI18n } from "@auth/config";
import { redisConnection } from "@auth/config";
import { connectDB, disconnectDB } from "@auth/database";
import { initEmailService } from "@auth/email";
import emailProcessor from "./email.processor.js";
import { RedisConnectionError } from "@auth/utils";

async function startWorker() {
  try {
    // Initialize services first
    await initI18n();
    await connectDB(); // Connect to MongoDB for EmailLog tracking
    await initEmailService();

    logger.info(t("worker:logs.starting"));

    emailProcessor.on("ready", () => {
      logger.info(t("worker:logs.ready"));
    });

    async function gracefulShutdown(signal) {
      logger.info(t("system:process.shutdownSignal", { signal }));
      await emailProcessor.close();
      await redisConnection.quit();
      await disconnectDB(); // Disconnect DB during graceful shutdown
      process.exit(0);
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    if (error instanceof RedisConnectionError) {
      logger.fatal(t("system:redis.connectionFailedAfterRetries"), error);
    } else {
      logger.fatal(t("worker:errors.startupFailed"), error);
    }
    process.exit(1);
  }
}

startWorker();
