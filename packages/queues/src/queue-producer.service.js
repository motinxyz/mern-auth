import { Queue } from "bullmq";
import {
  ConfigurationError,
  QueueError,
  ValidationError,
  CircuitBreakerError,
  createCircuitBreaker,
  withSpan,
  addSpanAttributes,
} from "@auth/utils";
import { metrics } from "@opentelemetry/api";
import { QUEUE_MESSAGES, QUEUE_ERRORS } from "./constants/queue.messages.js";
import { IQueueProducer } from "@auth/contracts";

// OTel metrics for queue producer
const meter = metrics.getMeter("auth-queues");
const producerJobsAdded = meter.createCounter(
  "queue_producer_jobs_added_total",
  {
    description: "Total jobs added to queue",
  }
);
const producerLatency = meter.createHistogram(
  "queue_producer_latency_seconds",
  {
    description: "Time to add job to queue in seconds",
    unit: "s",
  }
);

/**
 * Queue Producer Service
 * Generic queue management for producing jobs with DI
 *
 * @extends IQueueProducer
 */
class QueueProducerService extends IQueueProducer {
  constructor(options = {}) {
    super();

    if (!options.queueName) {
      throw new ConfigurationError(
        QUEUE_ERRORS.MISSING_CONFIG.replace("{config}", "queueName")
      );
    }
    if (!options.connection) {
      throw new ConfigurationError(
        QUEUE_ERRORS.MISSING_CONFIG.replace("{config}", "connection")
      );
    }
    if (!options.logger) {
      throw new ConfigurationError(
        QUEUE_ERRORS.MISSING_CONFIG.replace("{config}", "logger")
      );
    }

    this.queueName = options.queueName;
    this.connection = options.connection;
    this.logger = options.logger.child({ queue: this.queueName });
    this.defaultJobOptions =
      options.defaultJobOptions || this.getDefaultJobOptions();

    // Optional: Zod schema for job data validation
    this.jobSchema = options.jobSchema || null;

    // Optional: Enable circuit breaker (default: true)
    this.enableCircuitBreaker = options.enableCircuitBreaker !== false;

    // Circuit breaker timeout (externalized config)
    this.circuitBreakerTimeout = options.circuitBreakerTimeout || 3000;

    this.queue = null;
    this.circuitBreaker = null;
  }

  /**
   * Get default job options
   */
  getDefaultJobOptions() {
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
  async initialize() {
    return withSpan("QueueProducerService.initialize", async () => {
      addSpanAttributes({ "queue.name": this.queueName });

      this.queue = new Queue(this.queueName, {
        connection: this.connection,
        defaultJobOptions: this.defaultJobOptions,
        enableReadyEvent: false,
        enableKeyEvents: false,
      });

      this.setupEventHandlers();

      // Setup circuit breaker for addJob operation
      if (this.enableCircuitBreaker) {
        this.circuitBreaker = createCircuitBreaker(
          async (jobName, data, jobOptions) => {
            return await this.queue.add(jobName, data, jobOptions);
          },
          {
            name: `${this.queueName}-CircuitBreaker`,
            timeout: this.circuitBreakerTimeout,
          }
        );

        // Log circuit breaker events
        this.circuitBreaker.on("open", () => {
          this.logger.error(
            { queueName: this.queueName },
            QUEUE_MESSAGES.CIRCUIT_BREAKER_OPEN
          );
        });

        this.circuitBreaker.on("close", () => {
          this.logger.info(
            { queueName: this.queueName },
            QUEUE_MESSAGES.CIRCUIT_BREAKER_CLOSED
          );
        });
      }

      this.logger.info(
        { module: "queue", queueName: this.queueName },
        QUEUE_MESSAGES.QUEUE_INITIALIZED
      );
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.queue.on("error", (err) => {
      this.logger.error(
        { err, queueName: this.queueName },
        QUEUE_ERRORS.QUEUE_ERROR
      );
    });

    this.queue.on("waiting", (jobId) => {
      this.logger.debug({ jobId }, QUEUE_MESSAGES.JOB_WAITING);
    });
  }

  /**
   * Add a job to the queue
   */
  async addJob(jobName, data, customOptions = {}) {
    return withSpan("QueueProducerService.addJob", async () => {
      addSpanAttributes({
        "queue.name": this.queueName,
        "job.name": jobName,
      });

      if (!this.queue) {
        throw new QueueError(QUEUE_ERRORS.QUEUE_NOT_INITIALIZED);
      }

      // Validate job data if schema provided
      if (this.jobSchema) {
        try {
          this.jobSchema.parse(data);
        } catch (error) {
          this.logger.error(
            { err: error, jobData: data },
            QUEUE_ERRORS.JOB_DATA_VALIDATION_FAILED
          );
          throw new ValidationError(error.errors, "Invalid job data");
        }
      }

      this.logger.info(
        { job: { name: jobName, data } },
        QUEUE_MESSAGES.ADDING_JOB
      );

      const startTime = Date.now();

      try {
        const jobOptions = {
          ...this.defaultJobOptions,
          ...customOptions,
        };

        // Use circuit breaker if enabled
        const job = this.enableCircuitBreaker
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

        addSpanAttributes({ "job.id": job.id });

        if (customOptions.jobId) {
          this.logger.debug(
            { jobId: customOptions.jobId, jobName },
            QUEUE_MESSAGES.DEDUPLICATION_JOB
          );
        }

        return job;
      } catch (error) {
        // Record failure metric
        producerJobsAdded.add(1, {
          queue: this.queueName,
          job_type: jobName,
          status: "failed",
        });

        // Check if circuit breaker is open
        if (error.code === "EOPENBREAKER") {
          this.logger.error(
            { queueName: this.queueName },
            QUEUE_MESSAGES.CIRCUIT_BREAKER_OPEN
          );
          throw new CircuitBreakerError(
            QUEUE_MESSAGES.CIRCUIT_BREAKER_UNAVAILABLE
          );
        }

        this.logger.error(
          { err: error, jobData: data },
          QUEUE_ERRORS.JOB_CREATION_FAILED
        );
        throw error;
      }
    });
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
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
  async getHealth() {
    if (!this.queue) {
      return {
        healthy: false,
        reason: "Queue not initialized",
      };
    }

    try {
      // Measure Redis latency
      const pingStart = Date.now();
      await this.queue.client.ping();
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
        circuitBreaker: this.enableCircuitBreaker
          ? {
              state: this.circuitBreaker.opened ? "open" : "closed",
            }
          : null,
      };
    } catch (error) {
      return {
        healthy: false,
        reason: error.message,
      };
    }
  }

  /**
   * Pause the queue
   */
  async pause() {
    if (this.queue) {
      await this.queue.pause();
      this.logger.info(QUEUE_MESSAGES.QUEUE_PAUSED, {
        queueName: this.queueName,
      });
    }
  }

  /**
   * Resume the queue
   */
  async resume() {
    if (this.queue) {
      await this.queue.resume();
      this.logger.info(QUEUE_MESSAGES.QUEUE_RESUMED, {
        queueName: this.queueName,
      });
    }
  }

  /**
   * Close the queue
   */
  async close() {
    if (this.queue) {
      await this.queue.close();
      this.logger.info(QUEUE_MESSAGES.QUEUE_CLOSED, {
        queueName: this.queueName,
      });
    }
  }

  /**
   * Get the underlying queue instance
   */
  getQueue() {
    return this.queue;
  }
}

export default QueueProducerService;
