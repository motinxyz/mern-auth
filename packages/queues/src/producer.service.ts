import type { JobsOptions } from "bullmq";
import { ConfigurationError, withSpan, addSpanAttributes } from "@auth/utils";
import type { ILogger, QueueJob, JobOptions, QueueHealth } from "@auth/contracts";
import type QueueProducerService from "./queue-producer.service.js";
import { QUEUE_MESSAGES, QUEUE_ERRORS } from "./constants/queue.messages.js";

/**
 * Producer Service Options
 */
export interface ProducerServiceOptions {
  readonly queueService: QueueProducerService;
  readonly logger: ILogger;
}

/**
 * Producer Service
 *
 * Generic job producer with DI.
 * Wraps QueueProducerService with convenience methods.
 * Implements IQueueProducer contract.
 */
class ProducerService {
  private readonly queueService: QueueProducerService;
  private readonly logger: ILogger;

  constructor(options: ProducerServiceOptions) {
    if (options.queueService === undefined) {
      throw new ConfigurationError(QUEUE_ERRORS.PRODUCER_MISSING_QUEUE);
    }
    if (options.logger === undefined) {
      throw new ConfigurationError(QUEUE_ERRORS.PRODUCER_MISSING_LOGGER);
    }

    this.queueService = options.queueService;
    this.logger = options.logger.child({ module: "producer" });
  }

  /**
   * Convert contract JobOptions to BullMQ JobsOptions
   * Uses conditional spread to satisfy exactOptionalPropertyTypes
   */
  private toBullMqOptions(options: JobOptions): JobsOptions {
    return {
      ...(options.jobId !== undefined && { jobId: options.jobId }),
      ...(options.delay !== undefined && { delay: options.delay }),
      ...(options.attempts !== undefined && { attempts: options.attempts }),
      ...(options.backoff !== undefined && { backoff: options.backoff }),
      ...(options.priority !== undefined && { priority: options.priority }),
      ...(options.removeOnComplete !== undefined && { removeOnComplete: options.removeOnComplete }),
      ...(options.removeOnFail !== undefined && { removeOnFail: options.removeOnFail }),
    };
  }

  /**
   * Add a job to the queue
   * @param jobType - The job type
   * @param data - The job data
   * @param customOptions - Optional job options
   */
  async addJob(jobType: string, data: unknown, customOptions: JobOptions = {}): Promise<QueueJob> {
    return withSpan("ProducerService.addJob", async () => {
      addSpanAttributes({ "job.type": jobType });

      this.logger.info({ jobType }, QUEUE_MESSAGES.ADDING_JOB);

      try {
        const bullMqOptions = this.toBullMqOptions(customOptions);

        const job = await this.queueService.addJob(
          jobType,
          { type: jobType, data },
          bullMqOptions
        );

        if (job.id !== undefined) {
          addSpanAttributes({ "job.id": job.id });
        }
        this.logger.debug({ jobId: job.id, jobType }, QUEUE_MESSAGES.JOB_ADDED);

        // Map BullMQ Job to contract QueueJob using conditional spread for optional id
        const result: QueueJob = {
          ...(job.id !== undefined && { id: job.id }),
          name: job.name,
          data: job.data,
          opts: customOptions,
        };
        return result;
      } catch (error) {
        this.logger.error({ err: error, jobType }, QUEUE_ERRORS.JOB_CREATION_FAILED);
        throw error;
      }
    });
  }

  /**
   * Add a job with deduplication (using jobId)
   * @param jobType - The job type
   * @param data - The job data
   * @param deduplicationKey - Unique key for deduplication
   * @param customOptions - Optional job options
   */
  async addJobWithDeduplication(
    jobType: string,
    data: unknown,
    deduplicationKey: string,
    customOptions: JobOptions = {}
  ): Promise<QueueJob> {
    return this.addJob(jobType, data, {
      ...customOptions,
      jobId: deduplicationKey,
    });
  }

  /**
   * Add a delayed job
   * @param jobType - The job type
   * @param data - The job data
   * @param delayMs - Delay in milliseconds
   * @param customOptions - Optional job options
   */
  async addDelayedJob(
    jobType: string,
    data: unknown,
    delayMs: number,
    customOptions: JobOptions = {}
  ): Promise<QueueJob> {
    return this.addJob(jobType, data, {
      ...customOptions,
      delay: delayMs,
    });
  }

  /**
   * Add a job with priority
   * @param jobType - The job type
   * @param data - The job data
   * @param priority - Priority (lower number = higher priority)
   * @param customOptions - Optional job options
   */
  async addPriorityJob(
    jobType: string,
    data: unknown,
    priority: number,
    customOptions: JobOptions = {}
  ): Promise<QueueJob> {
    return this.addJob(jobType, data, {
      ...customOptions,
      priority,
    });
  }

  /**
   * Get queue health status
   */
  async getHealth(): Promise<QueueHealth> {
    const health = await this.queueService.getHealth();

    // Map internal health result to contract, converting null to undefined
    return {
      healthy: health.healthy,
      ...(health.circuitBreaker && {
        circuitBreaker: {
          state: health.circuitBreaker.state,
        },
      }),
    };
  }
}

export default ProducerService;
