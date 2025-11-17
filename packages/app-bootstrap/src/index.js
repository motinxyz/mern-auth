import {
  EmailServiceInitializationError,
  DatabaseConnectionError,
  RedisConnectionError,
} from "@auth/utils";

/**
 * Initializes common application services (i18n, database, email).
 * Handles parallel initialization and robust error reporting.
 * @param {import('awilix').AwilixContainer} container - The Awilix DI container.
 * @returns {Promise<void>} A promise that resolves when all common services are initialized.
 */
export async function initializeCommonServices(container) {
  const { config, logger, t, initI18n, connectDB, initEmailService } = container.cradle;

  // Initialize i18n first and await its completion as other services might depend on it
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
      } else if (error instanceof RedisConnectionError) {
        logger.fatal(t("system:redis.connectionFailedAfterRetries"), error);
      } else {
        logger.error(
          t("system:server.serviceStartError", { service: serviceName }),
          error,
        );
      }
    });
    logger.fatal(
      t("system:server.failedToStartServices"),
      `Exiting in ${config.shutdownTimeoutMs / 1000} seconds...`,
    );
    // Give some time for logs to be flushed and external systems to react
    await new Promise((resolve) =>
      setTimeout(resolve, config.shutdownTimeoutMs),
    );
    process.exit(1);
  }

  logger.info(t("system:server.allServicesStarted"));
}

/**
 * Initializes all necessary services in parallel and starts the API server.
 * @param {Express.Application} app - The Express application instance.
 * @param {import('awilix').AwilixContainer} container - The Awilix DI container.
 * @returns {Promise<import('http').Server>} The HTTP server instance.
 */
export async function bootstrapApplication(app, container) {
  const { config, logger, t, disconnectDB } = container.cradle;

  await initializeCommonServices(container); // Initialize common services

  const server = app.listen(config.port, () => {
    logger.info(t("system:server.startSuccess", { port: config.port }));
  });

  const gracefulShutdown = async (signal) => {
    logger.info(t("system:process.shutdownSignal", { signal }));
    server.close(async () => {
      logger.info(t("system:server.closeSuccess"));
      await disconnectDB(); // Disconnect DB during graceful shutdown
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  return server;
}