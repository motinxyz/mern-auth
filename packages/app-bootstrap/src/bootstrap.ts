import type { Application } from "express";
import type { Server } from "http";
import type { IDatabaseService, IEmailService } from "@auth/contracts";
import { config, getLogger, getRedisConnection, type ExtendedRedis } from "@auth/config";
import { initI18n } from "@auth/config";
import { DatabaseConnectionError, RedisConnectionError, withSpan, addSpanAttributes } from "@auth/utils";
import { BOOTSTRAP_MESSAGES } from "./constants/bootstrap.messages.js";
import { createDatabaseService } from "./services/database.service.factory.js";
import { createEmailService } from "./services/email.service.factory.js";
import { getQueueServices as getQueueServicesFromPackage, type QueueServices } from "@auth/queues";
import { getOriginalError } from "./types/errors.js";
import type { InitializedServices, ServiceDefinition, BootstrapHealth } from "./types/index.js";

const logger = getLogger();

// Typed singleton holders - internal only, not exported
let redisServiceInstance: ExtendedRedis | null = null;
let databaseServiceInstance: IDatabaseService | null = null;
let emailServiceInstance: IEmailService | null = null;

/**
 * Get or create Redis connection singleton
 *
 * Returns the Redis connection (ExtendedRedis with circuit breaker).
 * This is the centralized access point for Redis in the composition root.
 */
export function getRedisService(): ExtendedRedis {
  if (redisServiceInstance === null) {
    redisServiceInstance = getRedisConnection();
  }
  return redisServiceInstance;
}

/**
 * Get or create DatabaseService singleton
 *
 * Returns a fully typed IDatabaseService instance.
 * Creates lazily on first access.
 */
export function getDatabaseService(): IDatabaseService {
  if (databaseServiceInstance === null) {
    databaseServiceInstance = createDatabaseService();
  }
  return databaseServiceInstance;
}

/**
 * Get or create EmailService singleton
 *
 * Returns a fully typed IEmailService instance.
 * Automatically wires up database service dependency.
 */
export function getEmailService(): IEmailService {
  if (emailServiceInstance === null) {
    const dbService = getDatabaseService();
    emailServiceInstance = createEmailService(dbService);
  }
  return emailServiceInstance;
}

/**
 * Get or create Queue Services singletons
 *
 * Returns typed queue services from the queues package.
 */
export function getQueueServices(): QueueServices {
  return getQueueServicesFromPackage();
}

/**
 * Check health of all bootstrap services
 *
 * Returns comprehensive health status for readiness probes.
 * Useful for Kubernetes readiness/liveness checks.
 */
export async function checkBootstrapHealth(): Promise<BootstrapHealth> {
  return withSpan("bootstrap.checkHealth", async () => {
    const db = getDatabaseService();
    const email = getEmailService();

    const dbPing = await db.ping().catch(() => false);
    const emailHealth = email.getCircuitBreakerHealth();
    const dbState = db.getConnectionState();

    const dbHealthy = dbPing === true;
    const emailHealthy = emailHealth.initialized && emailHealth.state !== "open";

    addSpanAttributes({
      "health.database": dbHealthy,
      "health.email": emailHealthy,
      "health.database_state": dbState.readyState,
      "health.email_circuit_state": emailHealth.state,
    });

    return {
      healthy: dbHealthy && emailHealthy,
      database: {
        healthy: dbHealthy,
        readyState: dbState.readyState,
      },
      email: {
        healthy: emailHealthy,
      },
      queues: {
        healthy: true, // Queue producer is fire-and-forget
      },
    };
  });
}

/**
 * Initializes common application services (i18n, database, email).
 *
 * Handles parallel initialization and robust error reporting.
 * Uses Promise.allSettled for resilient startup with detailed failure logging.
 * Instrumented with OpenTelemetry for observability.
 *
 * @returns Promise resolving to initialized services for shutdown handling
 * @throws Never - exits process on critical failures
 */
export async function initializeCommonServices(): Promise<InitializedServices> {
  return withSpan("bootstrap.initializeServices", async () => {
    // Initialize i18n first as other services might depend on translations
    await withSpan("bootstrap.initI18n", async () => {
      await initI18n();
    });
    logger.info({ module: "bootstrap" }, BOOTSTRAP_MESSAGES.I18N_INITIALIZED);

    // Get services (lazy initialization)
    const dbService = getDatabaseService();
    const emService = getEmailService();
    const queueServices = getQueueServices();

    const services: readonly ServiceDefinition[] = [
      { name: "database", init: () => withSpan("bootstrap.database.connect", () => dbService.connect()) },
      { name: "email", init: () => withSpan("bootstrap.email.initialize", () => emService.initialize()) },
      { name: "emailQueue", init: () => withSpan("bootstrap.queue.initialize", () => queueServices.emailQueueProducer.initialize()) },
    ];

    const results = await Promise.allSettled(
      services.map((s) => s.init().then(() => s.name))
    );

    const criticalFailures: unknown[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const service = services[index];
        const serviceName = service?.name ?? "unknown";
        const error = result.reason;

        addSpanAttributes({
          "bootstrap.failed_service": serviceName,
          "bootstrap.error": String(error),
        });

        if (error instanceof DatabaseConnectionError) {
          logger.fatal(
            { err: getOriginalError(error) },
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
      }
    });

    if (criticalFailures.length > 0) {
      const timeoutSeconds = config.shutdownTimeoutMs / 1000;
      logger.fatal(
        `${BOOTSTRAP_MESSAGES.FAILED_TO_START_SERVICES} Exiting in ${timeoutSeconds} seconds...`
      );
      addSpanAttributes({
        "bootstrap.critical_failures": criticalFailures.length,
        "bootstrap.exit": true,
      });
      // Give time for logs to flush and external systems to react
      await new Promise((resolve) => setTimeout(resolve, config.shutdownTimeoutMs));
      process.exit(1);
    }

    addSpanAttributes({
      "bootstrap.services_started": services.length,
      "bootstrap.success": true,
    });

    logger.info({ module: "bootstrap" }, BOOTSTRAP_MESSAGES.ALL_SERVICES_STARTED);

    return {
      databaseService: dbService,
      emailService: emService,
    };
  });
}

/**
 * Initializes all necessary services and starts the HTTP server.
 *
 * Sets up graceful shutdown handlers for SIGTERM and SIGINT.
 * Ensures clean disconnection of all services on shutdown.
 * Instrumented with OpenTelemetry for observability.
 *
 * @param app - The Express application instance
 * @param onShutdown - Optional callback to run during graceful shutdown
 * @returns Promise resolving to the HTTP server instance
 */
export async function bootstrapApplication(
  app: Application,
  onShutdown?: () => Promise<void>
): Promise<Server> {
  // Initialize services with tracing - span ends after init completes
  const { databaseService } = await initializeCommonServices();

  // Server lifecycle is NOT wrapped in a span to avoid capturing all HTTP requests
  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(
      { module: "bootstrap", port: config.port },
      BOOTSTRAP_MESSAGES.SERVER_START_SUCCESS
    );
  });

  const gracefulShutdown = async (signal: string): Promise<void> => {
    await withSpan("bootstrap.shutdown", async () => {
      addSpanAttributes({ "shutdown.signal": signal });

      logger.info(
        { signal },
        `${BOOTSTRAP_MESSAGES.SHUTDOWN_SIGNAL_RECEIVED}: ${signal}`
      );

      // Create a timeout promise for forced exit
      const shutdownTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(BOOTSTRAP_MESSAGES.SHUTDOWN_TIMEOUT_EXCEEDED));
        }, config.shutdownTimeoutMs);
      });

      // Create ordered shutdown promise
      const shutdownPromise = new Promise<void>((resolve) => {
        server.close(() => {
          logger.info({ module: "bootstrap" }, BOOTSTRAP_MESSAGES.SERVER_CLOSED);

          // Execute shutdown in order
          void (async (): Promise<void> => {
            if (onShutdown !== undefined) {
              try {
                await onShutdown();
              } catch (error: unknown) {
                logger.error(
                  { err: error },
                  BOOTSTRAP_MESSAGES.CUSTOM_SHUTDOWN_ERROR
                );
              }
            }

            await databaseService.disconnect();
            resolve();
          })();
        });
      });

      try {
        // Race between shutdown and timeout
        await Promise.race([shutdownPromise, shutdownTimeout]);
        addSpanAttributes({ "shutdown.success": true });
        process.exit(0);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.fatal({ err: error }, message);
        addSpanAttributes({ "shutdown.success": false, "shutdown.error": message });
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => { void gracefulShutdown("SIGTERM"); });
  process.on("SIGINT", () => { void gracefulShutdown("SIGINT"); });

  return server;
}

