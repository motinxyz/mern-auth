import QueueProcessorService from "./queue-processor.service.js";
import { WORKER_MESSAGES, WORKER_ERRORS } from "./constants/worker.messages.js";
import { ConfigurationError } from "@auth/utils";
import type {
  ILogger,
  WorkerServiceOptions,
  ProcessorRegistrationConfig,
  IQueueProcessor,
  WorkerHealth,
  WorkerMetrics,
  IDatabaseService,
  ISentry,
} from "@auth/contracts";
import { initSentry } from "./monitoring/sentry.js";
import { WorkerConfigSchema } from "./schemas/config.schema.js";

/**
 * Worker Service
 * Generic orchestrator for any queue processors
 */
class WorkerService {
  private readonly sentry: ISentry | null;
  private readonly logger: ILogger;
  private readonly redisConnection: unknown;
  private readonly processors: IQueueProcessor[];
  private readonly databaseService: IDatabaseService | null;
  private readonly initServices: Array<() => Promise<void>>;

  constructor(options: WorkerServiceOptions) {
    // Validate configuration
    if (options.logger === undefined) {
      throw new ConfigurationError(
        WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "logger")
      );
    }
    if (options.redisConnection === undefined) {
      throw new ConfigurationError(
        WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "redisConnection")
      );
    }

    // Initialize Sentry or use provided instance
    this.sentry =
      options.sentry ??
      initSentry({
        dsn: options.sentryDsn,
        environment: options.environment ?? "development",
      });

    this.logger = options.logger;
    this.redisConnection = options.redisConnection;
    this.processors = [];

    // Optional: Database service (injected, not created)
    this.databaseService = options.databaseService ?? null;

    // Optional: Initialize services passed in
    this.initServices = options.initServices ?? [];
  }

  /**
   * Register a queue processor
   */
  registerProcessor(processorConfig: ProcessorRegistrationConfig): IQueueProcessor {
    const processor = new QueueProcessorService({
      queueName: processorConfig.queueName,
      connection: this.redisConnection,
      processor: processorConfig.processor,
      logger: this.logger,
      sentry: this.sentry ?? undefined,
      workerConfig: processorConfig.workerConfig !== undefined
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
  async start(): Promise<void> {
    try {
      this.logger.info({ module: "worker" }, WORKER_MESSAGES.WORKER_STARTING);

      // Connect to database if provided
      if (this.databaseService !== null) {
        // Database service must have a connect method
        await (this.databaseService as unknown as { connect: () => Promise<void> }).connect();
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
          String(this.processors.length)
        )
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.fatal(WORKER_ERRORS.STARTUP_FAILED, errorMessage);
      throw error;
    }
  }

  /**
   * Stop the worker service gracefully
   */
  async stop(timeoutMs = 30000): Promise<void> {
    this.logger.info(
      { module: "worker" },
      WORKER_MESSAGES.WORKER_SHUTTING_DOWN
    );

    // Wait for in-flight jobs to complete (with timeout)
    const waitForJobs = async (): Promise<boolean> => {
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
    if (this.databaseService !== null) {
      await this.databaseService.disconnect();
    }

    this.logger.info(WORKER_MESSAGES.WORKER_SERVICE_STOPPED);
  }

  /**
   * Drain mode - stop accepting new jobs but finish existing ones
   */
  async drain(): Promise<void> {
    this.logger.info(WORKER_MESSAGES.DRAIN_MODE_ENTERING);

    for (const processor of this.processors) {
      await processor.pause();
    }
  }

  /**
   * Exit drain mode
   */
  async undrain(): Promise<void> {
    this.logger.info(WORKER_MESSAGES.DRAIN_MODE_EXITING);

    for (const processor of this.processors) {
      await processor.resume();
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      this.logger.info(
        `${WORKER_MESSAGES.WORKER_SHUTTING_DOWN} Signal: ${signal}`
      );
      try {
        await this.stop();
        process.exit(0);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(WORKER_ERRORS.SHUTDOWN_ERROR, errorMessage);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
  }

  /**
   * Get health status of all processors
   */
  async getHealth(): Promise<WorkerHealth> {
    const health: WorkerHealth = {
      healthy: true,
      processors: [],
      database: null,
    };

    // Check database health if provided
    if (this.databaseService !== null) {
      const isConnected = await this.databaseService.ping();
      health.database = { healthy: isConnected };
      if (!isConnected) {
        health.healthy = false;
      }
    }

    // Check all processors
    for (const processor of this.processors) {
      const processorHealth = await processor.getHealth();
      health.processors.push({
        healthy: processorHealth.healthy,
        queueName: processorHealth.queueName ?? "unknown",
        isRunning: processorHealth.isRunning,
        isPaused: processorHealth.isPaused,
      });
      if (!processorHealth.healthy) {
        health.healthy = false;
      }
    }

    return health;
  }

  /**
   * Get metrics from all processors
   */
  getMetrics(): Array<{ queueName: string; metrics: WorkerMetrics }> {
    return this.processors.map((processor) => ({
      queueName: (processor as QueueProcessorService).queueName,
      metrics: processor.getMetrics(),
    }));
  }

  /**
   * Pause all processors
   */
  async pauseAll(): Promise<void> {
    for (const processor of this.processors) {
      await processor.pause();
    }
    this.logger.info(WORKER_MESSAGES.ALL_PROCESSORS_PAUSED);
  }

  /**
   * Resume all processors
   */
  async resumeAll(): Promise<void> {
    for (const processor of this.processors) {
      await processor.resume();
    }
    this.logger.info(WORKER_MESSAGES.ALL_PROCESSORS_RESUMED);
  }

  /**
   * Get all processors
   */
  getProcessors(): IQueueProcessor[] {
    return this.processors;
  }

  /**
   * Get database service instance
   */
  getDatabaseService(): IDatabaseService | null {
    return this.databaseService;
  }
}

export default WorkerService;
