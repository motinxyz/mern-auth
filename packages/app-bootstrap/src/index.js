import { config, logger, initI18n, t } from "@auth/config";
import { connectDB, disconnectDB } from "@auth/database";
import { initEmailService } from "@auth/email";
import {
  EmailServiceInitializationError,
  DatabaseConnectionError,
} from "@auth/utils";

/**
 * Initializes all necessary services in parallel and starts the API server.
 * @param {Express.Application} app - The Express application instance.
 * @returns {Promise<import('http').Server>} The HTTP server instance.
 */
export async function bootstrapApplication(app) {
  // Initialize i18n first and await its completion
  await initI18n();

  const services = [
    { name: "database", init: connectDB },
    { name: "email", init: initEmailService },
  ];

  const results = await Promise.allSettled(
    services.map((s) => s.init().then(() => s.name)),
  );

  const failedServices = results.filter((r) => r.status === "rejected");

  if (failedServices.length > 0) {
    failedServices.forEach((failure) => {
      const serviceName = services[results.indexOf(failure)].name;
      const error = failure.reason;

      if (error instanceof DatabaseConnectionError) {
        logger.fatal(
          t("system:db.connectionFailedAfterRetries"),
          error.originalError,
        );
      } else if (error instanceof EmailServiceInitializationError) {
        logger.fatal(t("email:errors.smtpConnectionFailed"), error);
      } else {
        logger.error(
          t("system:server.serviceStartError", { service: serviceName }),
          error,
        );
      }
    });
    process.exit(1);
  }

  logger.info(t("system:server.allServicesStarted"));

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
}