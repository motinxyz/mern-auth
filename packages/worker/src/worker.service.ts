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
  IRedisConnection,
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
  private readonly redisConnection: IRedisConnection;
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

    this.logger = options.logger;
    this.redisConnection = options.redisConnection;
    this.databaseService = options.databaseService ?? null;
    this.initServices = options.initServices ?? [];
    this.processors = [];

    // Initialize Sentry if configured
    if (options.sentry !== undefined) {
      this.sentry = options.sentry;
    } else if (options.sentryDsn !== undefined) {
      this.sentry = initSentry({
        dsn: options.sentryDsn,
        ...(options.environment !== undefined ? { environment: options.environment } : {}),
      });
    } else {
      this.sentry = null;
    }
  }

  /**
   * Register a queue processor
   * 
   * BOUNDARY CAST: BullMQ requires its own connection/processor types.
   * We cast once here at the library boundary, keeping business logic clean.
   */
  registerProcessor<T = unknown>(processorConfig: ProcessorRegistrationConfig<T>): IQueueProcessor {
    const processorOptions = {
      queueName: processorConfig.queueName,
      // BOUNDARY: IRedisConnection -> BullMQ ConnectionOptions
      connection: this.redisConnection as unknown,
      // BOUNDARY: IJob<T> processor -> IJob<unknown> for BullMQ wrapper
      processor: processorConfig.processor as unknown as (job: { id: string; name: string; data: unknown; attemptsMade: number; opts: Record<string, unknown> }) => Promise<unknown>,
      logger: this.logger,
      ...(this.sentry !== null ? { sentry: this.sentry } : {}),
      ...(processorConfig.workerConfig !== undefined
        ? { workerConfig: WorkerConfigSchema.parse(processorConfig.workerConfig) }
        : {}),
      ...(processorConfig.deadLetterQueueName !== undefined
        ? { deadLetterQueueName: processorConfig.deadLetterQueueName }
        : {}),
    };

    const processor = new QueueProcessorService(processorOptions);

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

      this.logger.info({ module: "worker" }, WORKER_MESSAGES.WORKER_STARTED);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { err: error, module: "worker" },
        `${WORKER_ERRORS.WORKER_START_FAILED}: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown(): void {
    const shutdown = async (signal: string): Promise<void> => {
      this.logger.info({ signal }, WORKER_MESSAGES.SHUTDOWN_SIGNAL);
      await this.stop();
      process.exit(0);
    };

    process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
    process.on("SIGINT", () => { void shutdown("SIGINT"); });
  }

  /**
   * Get aggregated health from all processors
   */
  async getHealth(): Promise<WorkerHealth> {
    const processorHealths = await Promise.all(
      this.processors.map((p) => p.getHealth())
    );

    const healthy = processorHealths.every((h) => h.healthy);

    const healthEntry: WorkerHealth = {
      healthy,
      processors: processorHealths,
      database: this.databaseService !== null
        ? { healthy: true }  // If database service exists, consider healthy
        : null,
    };

    return healthEntry;
  }

  /**
   * Get metrics from all processors (IWorkerService contract)
   */
  getMetrics(): Array<{ queueName: string; metrics: WorkerMetrics }> {
    return this.processors.map((processor) => ({
      queueName: processor.queueName,
      metrics: processor.getMetrics(),
    }));
  }

  /**
   * Stop the worker service gracefully
   */
  async stop(timeoutMs = 30000): Promise<void> {
    this.logger.info({ module: "worker" }, WORKER_MESSAGES.WORKER_STOPPING);

    // Wait for active jobs to complete
    const waitForJobs = async (): Promise<boolean> => {
      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        const activeJobs = this.processors.reduce(
          (sum, p) => sum + p.getMetrics().active,
          0
        );

        if (activeJobs === 0) {
          return true;
        }

        this.logger.debug(
          { activeJobs, timeoutMs },
          WORKER_MESSAGES.WAITING_FOR_JOBS
        );
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
   * Drain mode - stop accepting new jobs
   */
  async drain(): Promise<void> {
    for (const processor of this.processors) {
      await processor.pause();
    }
    this.logger.info(WORKER_MESSAGES.WORKER_DRAINED);
  }

  /**
   * Resume accepting jobs after drain
   */
  async resume(): Promise<void> {
    for (const processor of this.processors) {
      await processor.resume();
    }
    this.logger.info(WORKER_MESSAGES.WORKER_RESUMED);
  }

  /**
   * Pause all processors (IWorkerService contract)
   */
  async pauseAll(): Promise<void> {
    await this.drain();
  }

  /**
   * Resume all processors (IWorkerService contract)
   */
  async resumeAll(): Promise<void> {
    await this.resume();
  }

  /**
   * Get all registered processors (IWorkerService contract)
   */
  getProcessors(): IQueueProcessor[] {
    return this.processors;
  }
}

export default WorkerService;
