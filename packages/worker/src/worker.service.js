import QueueProcessorService from "./queue-processor.service.js";
import { WORKER_MESSAGES, WORKER_ERRORS } from "./constants/worker.messages.js";
import { ConfigurationError } from "@auth/utils";
import { initSentry } from "./monitoring/sentry.js";
import { WorkerConfigSchema } from "./schemas/config.schema.js";

/**
 * Worker Service
 * Generic orchestrator for any queue processors
 */
class WorkerService {
  constructor(options = {}) {
    // Validate configuration
    if (!options.logger) {
      throw new ConfigurationError(
        WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "logger")
      );
    }
    if (!options.redisConnection) {
      throw new ConfigurationError(
        WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "redisConnection")
      );
    }

    // Initialize Sentry or use provided instance
    this.sentry =
      options.sentry ||
      initSentry({
        dsn: options.sentryDsn,
        environment: options.environment || "development",
      });

    this.logger = options.logger;
    this.redisConnection = options.redisConnection;
    this.processors = [];

    // Optional: Database service (injected, not created)
    this.databaseService = options.databaseService || null;

    // Optional: Initialize services passed in
    this.initServices = options.initServices || [];
  }

  /**
   * Register a queue processor
   * @param {Object} processorConfig - Configuration for the processor
   * @param {string} processorConfig.queueName - Name of the queue
   * @param {Function} processorConfig.processor - Job processor function
   * @param {Object} processorConfig.workerConfig - Worker configuration
   * @param {string} processorConfig.deadLetterQueueName - Dead letter queue name
   */
  registerProcessor(processorConfig) {
    const processor = new QueueProcessorService({
      queueName: processorConfig.queueName,
      connection: this.redisConnection,
      processor: processorConfig.processor,
      logger: this.logger,
      sentry: this.sentry,
      workerConfig: processorConfig.workerConfig
        ? WorkerConfigSchema.parse(processorConfig.workerConfig)
        : undefined,
      deadLetterQueueName: processorConfig.deadLetterQueueName,
    });

    this.processors.push(processor);
    return processor;
  }

  /**
   * Start the worker service
   */
  async start() {
    try {
      this.logger.info({ module: "worker" }, WORKER_MESSAGES.WORKER_STARTING);

      // Connect to database if provided
      if (this.databaseService) {
        await this.databaseService.connect();
      }

      // Initialize any additional services
      for (const initService of this.initServices) {
        await initService();
      }

      // Initialize all registered processors
      for (const processor of this.processors) {
        await processor.initialize();
      }

      this.logger.info(
        { module: "worker", processorCount: this.processors.length },
        WORKER_MESSAGES.WORKER_SERVICE_READY.replace(
          "{count}",
          this.processors.length
        )
      );
    } catch (error) {
      this.logger.fatal(WORKER_ERRORS.STARTUP_FAILED, error);
      throw error;
    }
  }

  /**
   * Stop the worker service gracefully
   * @param {number} timeoutMs - Maximum time to wait for jobs to complete (default: 30s)
   */
  async stop(timeoutMs = 30000) {
    this.logger.info(
      { module: "worker" },
      WORKER_MESSAGES.WORKER_SHUTTING_DOWN
    );

    // Wait for in-flight jobs to complete (with timeout)
    const waitForJobs = async () => {
      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        // Check if any processor has active jobs
        let hasActiveJobs = false;
        for (const processor of this.processors) {
          const metrics = processor.getMetrics();
          if (metrics.active > 0) {
            hasActiveJobs = true;
            break;
          }
        }

        if (!hasActiveJobs) {
          this.logger.info(WORKER_MESSAGES.ALL_JOBS_COMPLETED);
          return true;
        }

        // Wait 500ms before checking again
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.logger.warn({ timeoutMs }, WORKER_MESSAGES.SHUTDOWN_TIMEOUT);
      return false;
    };

    // Wait for jobs to complete
    await waitForJobs();

    // Close all processors
    for (const processor of this.processors) {
      await processor.close();
    }

    // Disconnect database if provided
    if (this.databaseService) {
      await this.databaseService.disconnect();
    }

    this.logger.info(WORKER_MESSAGES.WORKER_SERVICE_STOPPED);
  }

  /**
   * Drain mode - stop accepting new jobs but finish existing ones
   */
  async drain() {
    this.logger.info(WORKER_MESSAGES.DRAIN_MODE_ENTERING);

    for (const processor of this.processors) {
      await processor.pause();
    }
  }

  /**
   * Exit drain mode
   */
  async undrain() {
    this.logger.info(WORKER_MESSAGES.DRAIN_MODE_EXITING);

    for (const processor of this.processors) {
      await processor.resume();
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      this.logger.info(
        `${WORKER_MESSAGES.WORKER_SHUTTING_DOWN} Signal: ${signal}`
      );
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        this.logger.error(WORKER_ERRORS.SHUTDOWN_ERROR, error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  /**
   * Get health status of all processors
   */
  async getHealth() {
    const health = {
      healthy: true,
      processors: [],
      database: null,
    };

    // Check database health if provided
    if (this.databaseService) {
      const dbHealth = await this.databaseService.healthCheck();
      health.database = dbHealth;
      if (!dbHealth.healthy) {
        health.healthy = false;
      }
    }

    // Check all processors
    for (const processor of this.processors) {
      const processorHealth = await processor.getHealth();
      health.processors.push(processorHealth);
      if (!processorHealth.healthy) {
        health.healthy = false;
      }
    }

    return health;
  }

  /**
   * Get metrics from all processors
   */
  getMetrics() {
    return this.processors.map((processor) => ({
      queueName: processor.queueName,
      metrics: processor.getMetrics(),
    }));
  }

  /**
   * Pause all processors
   */
  async pauseAll() {
    for (const processor of this.processors) {
      await processor.pause();
    }
    this.logger.info(WORKER_MESSAGES.ALL_PROCESSORS_PAUSED);
  }

  /**
   * Resume all processors
   */
  async resumeAll() {
    for (const processor of this.processors) {
      await processor.resume();
    }
    this.logger.info(WORKER_MESSAGES.ALL_PROCESSORS_RESUMED);
  }

  /**
   * Get all processors
   */
  getProcessors() {
    return this.processors;
  }

  /**
   * Get database service instance
   */
  getDatabaseService() {
    return this.databaseService;
  }
}

export default WorkerService;
