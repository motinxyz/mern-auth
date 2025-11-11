import { config, logger, initI18n, t } from "@auth/config";
import { connectDB, disconnectDB } from "@auth/database";
import { initEmailService } from "@auth/email";
import { EmailServiceInitializationError } from "@auth/utils";

/**
 * Initializes all necessary services and starts the API server.
 * @param {Express.Application} app - The Express application instance.
 * @returns {Promise<import('http').Server>} The HTTP server instance.
 */
export async function bootstrapApplication(app) {
  try {
    await initI18n();
    await connectDB();
    await initEmailService();

    const server = app.listen(config.port, () => {
      logger.info(t("system:server.startSuccess", { port: config.port }));
    });

    const gracefulShutdown = async (signal) => {
      logger.info(t("system:process.shutdownSignal", { signal }));
      server.close(async () => {
        logger.info(t("system:server.closeSuccess"));
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    return server;
  } catch (error) {
    if (error instanceof EmailServiceInitializationError) {
      logger.fatal(t("email:errors.smtpConnectionFailed"), error);
    } else {
      logger.error(t("system:server.startError"), error);
    }
    process.exit(1);
  }
}