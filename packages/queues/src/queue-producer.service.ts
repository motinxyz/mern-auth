import { Queue, Job } from "bullmq";
import type { JobsOptions } from "bullmq";
import type { Redis } from "ioredis";
import type { ZodSchema, ZodError } from "zod";
import {
  ConfigurationError,
  QueueError,
  ValidationError,
  CircuitBreakerError,
  createCircuitBreaker,
} from "@auth/utils";
import { withSpan, addSpanAttributes } from "@auth/observability";
import type { ILogger } from "@auth/contracts";
import { metrics } from "@opentelemetry/api";
import { QUEUE_MESSAGES, QUEUE_ERRORS } from "./constants/queue.messages.js";

/**
 * Local Circuit Breaker Interface
 * Decouples from opossum dependency to avoid type issues without adding heavier dependencies
 */
interface ICircuitBreaker<TResponse = unknown> {
  fire(...args: unknown[]): Promise<TResponse>;
  on(event: string, listener: (...args: unknown[]) => void): this;
  opened: boolean;
}

// OTel metrics for queue producer
const meter = metrics.getMeter("auth-queues");
const producerJobsAdded = meter.createCounter("queue_producer_jobs_added_total", {
  description: "Total jobs added to queue",
});
const producerLatency = meter.createHistogram("queue_producer_latency_seconds", {
  description: "Time to add job to queue in seconds",
  unit: "s",
});

/**
 * Queue Producer Service Options
 */
export interface QueueProducerOptions {
  readonly queueName: string;
  readonly connection: Redis;
  readonly logger: ILogger;
  readonly defaultJobOptions?: JobsOptions;
  readonly jobSchema?: ZodSchema;
  readonly enableCircuitBreaker?: boolean;
  readonly circuitBreakerTimeout?: number;
}

/**
 * Queue health result
 */
export interface QueueHealthResult {
  readonly healthy: boolean;
  readonly reason?: string;
  readonly queueName?: string;
  readonly redis?: {
    readonly connected: boolean;
    readonly latencyMs: number;
  };
  readonly metrics?: QueueMetrics | null;
  readonly circuitBreaker?: {
    readonly state: "open" | "closed";
  } | null;
}

/**
 * Queue metrics
 */
interface QueueMetrics {
  readonly queueName: string;
  readonly waiting: number;
  readonly active: number;
  readonly completed: number;
  readonly failed: number;
  readonly delayed: number;
  readonly total: number;
}

/**
 * Queue Producer Service
 *
 * Generic queue management for producing jobs with DI.
 * Uses BullMQ with circuit breaker pattern and OTEL observability.
 */
class QueueProducerService {
  public readonly queueName: string;
  private readonly connection: Redis;
  private readonly logger: ILogger;
  private readonly defaultJobOptions: JobsOptions;
  private readonly jobSchema: ZodSchema | null;
  private readonly enableCircuitBreaker: boolean;
  private readonly circuitBreakerTimeout: number;
  private queue: Queue | null = null;
  private circuitBreaker: ICircuitBreaker<Job> | null = null;

  constructor(options: QueueProducerOptions) {
    if (options.queueName === undefined || options.queueName === "") {
      throw new ConfigurationError(QUEUE_ERRORS.MISSING_CONFIG.replace("{config}", "queueName"));
    }
    if (options.connection === undefined) {
      throw new ConfigurationError(QUEUE_ERRORS.MISSING_CONFIG.replace("{config}", "connection"));
    }
    if (options.logger === undefined) {
      throw new ConfigurationError(QUEUE_ERRORS.MISSING_CONFIG.replace("{config}", "logger"));
    }

    this.queueName = options.queueName;
    this.connection = options.connection;
    this.logger = options.logger.child({ queue: this.queueName });
    this.defaultJobOptions = options.defaultJobOptions ?? this.getDefaultJobOptions();
    this.jobSchema = options.jobSchema ?? null;
    this.enableCircuitBreaker = options.enableCircuitBreaker !== false;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout ?? 3000;
  }

  /**
   * Get default job options
   */
  private getDefaultJobOptions(): JobsOptions {
    return {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        count: 1000,
      },
      removeOnFail: {
        count: 5000,
      },
    };
  }

  /**
   * Initialize the queue
   */
  async initialize(): Promise<void> {
    return withSpan("QueueProducerService.initialize", async () => {
      addSpanAttributes({ "queue.name": this.queueName });

      this.queue = new Queue(this.queueName, {
        connection: this.connection,
        defaultJobOptions: this.defaultJobOptions,
      });

      this.setupEventHandlers();

      if (this.enableCircuitBreaker) {
        this.circuitBreaker = createCircuitBreaker(
          async (jobName: string, data: unknown, jobOptions: JobsOptions): Promise<Job> => {
            if (!this.queue) {
              throw new QueueError(this.queueName, QUEUE_ERRORS.QUEUE_NOT_INITIALIZED);
            }
            return this.queue.add(jobName, data, jobOptions);
          },
          {
            name: `${this.queueName}-CircuitBreaker`,
            timeout: this.circuitBreakerTimeout,
          }
        ) as unknown as ICircuitBreaker<Job>;

        this.circuitBreaker.on("open", () => {
          this.logger.error({ queueName: this.queueName }, QUEUE_MESSAGES.CIRCUIT_BREAKER_OPEN);
        });

        this.circuitBreaker.on("close", () => {
          this.logger.info({ queueName: this.queueName }, QUEUE_MESSAGES.CIRCUIT_BREAKER_CLOSED);
        });
      }

      this.logger.info({ module: "queue", queueName: this.queueName }, QUEUE_MESSAGES.QUEUE_INITIALIZED);
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.queue) return;

    this.queue.on("error", (err: Error) => {
      this.logger.error({ err, queueName: this.queueName }, QUEUE_ERRORS.QUEUE_ERROR);
    });
  }

  /**
   * Add a job to the queue
   */
  async addJob<T>(jobName: string, data: T, customOptions: JobsOptions = {}): Promise<Job<T>> {
    return withSpan("QueueProducerService.addJob", async () => {
      addSpanAttributes({
        "queue.name": this.queueName,
        "job.name": jobName,
      });

      if (!this.queue) {
        throw new QueueError(this.queueName, QUEUE_ERRORS.QUEUE_NOT_INITIALIZED);
      }

      // Validate job data if schema provided
      if (this.jobSchema) {
        const result = this.jobSchema.safeParse(data);
        if (!result.success) {
          const zodError = result.error as ZodError;
          this.logger.error({ err: zodError, jobData: data }, QUEUE_ERRORS.JOB_DATA_VALIDATION_FAILED);
          throw new ValidationError(zodError.issues, "Invalid job data");
        }
      }

      this.logger.info({ job: { name: jobName } }, QUEUE_MESSAGES.ADDING_JOB);

      const startTime = Date.now();

      try {
        const jobOptions: JobsOptions = {
          ...this.defaultJobOptions,
          ...customOptions,
        };

        // Use circuit breaker if enabled
        const job: Job = this.enableCircuitBreaker && this.circuitBreaker
          ? await this.circuitBreaker.fire(jobName, data, jobOptions)
          : await this.queue.add(jobName, data, jobOptions);

        // Record success metrics
        const latency = (Date.now() - startTime) / 1000;
        producerLatency.record(latency, { queue: this.queueName });
        producerJobsAdded.add(1, {
          queue: this.queueName,
          job_type: jobName,
          status: "success",
        });

        if (job.id !== undefined) {
          addSpanAttributes({ "job.id": job.id });
        }

        return job as Job<T>;
      } catch (error) {
        producerJobsAdded.add(1, {
          queue: this.queueName,
          job_type: jobName,
          status: "failed",
        });

        const err = error as Error & { code?: string };
        if (err.code === "EOPENBREAKER") {
          this.logger.error({ queueName: this.queueName }, QUEUE_MESSAGES.CIRCUIT_BREAKER_OPEN);
          throw new CircuitBreakerError(QUEUE_MESSAGES.CIRCUIT_BREAKER_UNAVAILABLE);
        }

        this.logger.error({ err: error }, QUEUE_ERRORS.JOB_CREATION_FAILED);
        throw error;
      }
    });
  }

  /**
   * Get queue metrics
   */
  async getMetrics(): Promise<QueueMetrics | null> {
    if (!this.queue) {
      return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      queueName: this.queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get queue health with Redis latency
   */
  async getHealth(): Promise<QueueHealthResult> {
    if (!this.queue) {
      return { healthy: false, reason: "Queue not initialized" };
    }

    try {
      const pingStart = Date.now();
      const client = await this.queue.client;
      await client.ping();
      const redisLatencyMs = Date.now() - pingStart;

      const queueMetrics = await this.getMetrics();

      return {
        healthy: true,
        queueName: this.queueName,
        redis: {
          connected: true,
          latencyMs: redisLatencyMs,
        },
        metrics: queueMetrics,
        circuitBreaker: this.enableCircuitBreaker && this.circuitBreaker
          ? { state: this.circuitBreaker.opened ? "open" : "closed" }
          : null,
      };
    } catch (error) {
      const err = error as Error;
      return { healthy: false, reason: err.message };
    }
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    if (this.queue) {
      await this.queue.pause();
      this.logger.info({ queueName: this.queueName }, QUEUE_MESSAGES.QUEUE_PAUSED);
    }
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    if (this.queue) {
      await this.queue.resume();
      this.logger.info({ queueName: this.queueName }, QUEUE_MESSAGES.QUEUE_RESUMED);
    }
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.logger.info({ queueName: this.queueName }, QUEUE_MESSAGES.QUEUE_CLOSED);
    }
  }

  /**
   * Get the underlying queue instance
   */
  getQueue(): Queue | null {
    return this.queue;
  }
}

export default QueueProducerService;
