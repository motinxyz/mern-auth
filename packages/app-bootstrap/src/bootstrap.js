import { config, getLogger, initI18n } from "@auth/config";
import { DatabaseConnectionError, RedisConnectionError } from "@auth/utils";
import { BOOTSTRAP_MESSAGES } from "./constants/bootstrap.messages.js";
import { createDatabaseService } from "./services/database.service.factory.js";
import { createEmailService } from "./services/email.service.factory.js";
import { getQueueServices as getQueueServicesFromPackage } from "@auth/queues";

const logger = getLogger();

// Singleton instances
let databaseService;
let emailService;

/**
 * Get or create DatabaseService singleton
 */
export function getDatabaseService() {
  if (!databaseService) {
    databaseService = createDatabaseService();
  }
  return databaseService;
}

/**
 * Get or create EmailService singleton
 */
export function getEmailService() {
  if (!emailService) {
    const dbService = getDatabaseService();
    emailService = createEmailService(dbService);
  }
  return emailService;
}

/**
 * Get or create Queue Services singletons
 */
export function getQueueServices() {
  return getQueueServicesFromPackage();
}

// Export for direct access after initialization
export { databaseService, emailService };

/**
 * Initializes common application services (i18n, database, email).
 * Handles parallel initialization and robust error reporting.
 * @returns {Promise<{databaseService: DatabaseService}>} Services for shutdown
 */
export async function initializeCommonServices() {
  // Initialize i18n first and await its completion as other services might depend on it
  await initI18n();
  logger.info({ module: "bootstrap" }, BOOTSTRAP_MESSAGES.I18N_INITIALIZED);

  // Get services (lazy initialization)
  const dbService = getDatabaseService();
  const emService = getEmailService();
  const queueServices = getQueueServices();

  const services = [
    { name: "database", init: () => dbService.connect() },
    { name: "email", init: () => emService.initialize() },
    {
      name: "emailQueue",
      init: () => queueServices.emailQueueProducer.initialize(),
    },
  ];

  const results = await Promise.allSettled(
    services.map((s) => s.init().then(() => s.name))
  );

  const failedServices = results.filter((r) => r.status === "rejected");

  if (failedServices.length > 0) {
    const criticalFailures = [];

    failedServices.forEach((failure) => {
      const serviceName = services[results.indexOf(failure)].name;
      const error = failure.reason;

      if (error instanceof DatabaseConnectionError) {
        logger.fatal(
          { err: error.originalError },
          BOOTSTRAP_MESSAGES.DATABASE_CONNECTION_FAILED
        );
        criticalFailures.push(error);
      } else if (error instanceof RedisConnectionError) {
        logger.fatal(
          { err: error },
          BOOTSTRAP_MESSAGES.REDIS_CONNECTION_FAILED
        );
        criticalFailures.push(error);
      } else {
        logger.error(
          { err: error, service: serviceName },
          `${BOOTSTRAP_MESSAGES.SERVICE_START_ERROR}: ${serviceName}`
        );
        // Treat unknown errors as critical for safety
        criticalFailures.push(error);
      }
    });

    if (criticalFailures.length > 0) {
      logger.fatal(
        BOOTSTRAP_MESSAGES.FAILED_TO_START_SERVICES,
        `Exiting in ${config.shutdownTimeoutMs / 1000} seconds...`
      );
      // Give some time for logs to be flushed and external systems to react
      await new Promise((resolve) =>
        setTimeout(resolve, config.shutdownTimeoutMs)
      );
      process.exit(1);
    }
  }

  logger.info({ module: "bootstrap" }, BOOTSTRAP_MESSAGES.ALL_SERVICES_STARTED);

  // Return services for graceful shutdown
  return { databaseService: dbService };
}

/**
 * Initializes all necessary services in parallel and starts the API server.
 * @param {Express.Application} app - The Express application instance.
 * @param {Function} [onShutdown] - Optional callback to run during graceful shutdown.
 * @returns {Promise<import('http').Server>} The HTTP server instance.
 */
export async function bootstrapApplication(app, onShutdown) {
  const { databaseService } = await initializeCommonServices(); // Initialize common services

  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(
      { module: "bootstrap", port: config.port },
      BOOTSTRAP_MESSAGES.SERVER_START_SUCCESS
    );
  });

  const gracefulShutdown = async (signal) => {
    logger.info(
      { signal },
      `${BOOTSTRAP_MESSAGES.SHUTDOWN_SIGNAL_RECEIVED}: ${signal}`
    );

    // Create a timeout promise
    const shutdownTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(BOOTSTRAP_MESSAGES.SHUTDOWN_TIMEOUT_EXCEEDED));
      }, config.shutdownTimeoutMs);
    });

    // Create shutdown promise
    const shutdownPromise = new Promise((resolve) => {
      server.close(async () => {
        logger.info({ module: "bootstrap" }, BOOTSTRAP_MESSAGES.SERVER_CLOSED);

        if (onShutdown) {
          try {
            await onShutdown();
          } catch (error) {
            logger.error(
              { err: error },
              BOOTSTRAP_MESSAGES.CUSTOM_SHUTDOWN_ERROR
            );
          }
        }

        await databaseService.disconnect(); // Disconnect DB during graceful shutdown
        resolve();
      });
    });

    try {
      // Race between shutdown and timeout
      await Promise.race([shutdownPromise, shutdownTimeout]);
      process.exit(0);
    } catch (error) {
      logger.fatal({ err: error }, error.message);
      process.exit(1);
    }
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  return server;
}
