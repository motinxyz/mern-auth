import { ConfigurationError, withSpan, addSpanAttributes } from "@auth/utils";
import type { ILogger } from "@auth/contracts";
import { QUEUE_MESSAGES, QUEUE_ERRORS } from "./constants/queue.messages.js";

/**
 * Producer Service
 * Generic job producer with DI
 */
class ProducerService {
  public queueService: any;
  public logger: ILogger;

  constructor(options: any = {}) {
    if (!options.queueService) {
      throw new ConfigurationError(QUEUE_ERRORS.PRODUCER_MISSING_QUEUE);
    }
    if (!options.logger) {
      throw new ConfigurationError(QUEUE_ERRORS.PRODUCER_MISSING_LOGGER);
    }

    this.queueService = options.queueService;
    this.logger = options.logger.child({ module: "producer" });
  }

  /**
   * Add a job to the queue
   * @param {string} jobType - The job type
   * @param {object} data - The job data
   * @param {object} customOptions - Optional BullMQ job options
   */
  async addJob(jobType, data, customOptions = {}) {
    return withSpan("ProducerService.addJob", async () => {
      addSpanAttributes({ "job.type": jobType });

      this.logger.info({ jobType, data }, QUEUE_MESSAGES.ADDING_JOB);

      try {
        const job = await this.queueService.addJob(
          jobType,
          { type: jobType, data },
          customOptions
        );

        addSpanAttributes({ "job.id": job.id });
        this.logger.debug({ jobId: job.id, jobType }, QUEUE_MESSAGES.JOB_ADDED);
        return job;
      } catch (error) {
        this.logger.error(
          { err: error, jobType, data },
          QUEUE_ERRORS.JOB_CREATION_FAILED
        );
        throw error;
      }
    });
  }

  /**
   * Add a job with deduplication (using jobId)
   * @param {string} jobType - The job type
   * @param {object} data - The job data
   * @param {string} deduplicationKey - Unique key for deduplication
   * @param {object} customOptions - Optional BullMQ job options
   */
  async addJobWithDeduplication(
    jobType,
    data,
    deduplicationKey,
    customOptions = {}
  ) {
    return this.addJob(jobType, data, {
      ...customOptions,
      jobId: deduplicationKey,
    });
  }

  /**
   * Add a delayed job
   * @param {string} jobType - The job type
   * @param {object} data - The job data
   * @param {number} delayMs - Delay in milliseconds
   * @param {object} customOptions - Optional BullMQ job options
   */
  async addDelayedJob(jobType, data, delayMs, customOptions = {}) {
    return this.addJob(jobType, data, {
      ...customOptions,
      delay: delayMs,
    });
  }

  /**
   * Add a job with priority
   * @param {string} jobType - The job type
   * @param {object} data - The job data
   * @param {number} priority - Priority (lower number = higher priority)
   * @param {object} customOptions - Optional BullMQ job options
   */
  async addPriorityJob(jobType, data, priority, customOptions = {}) {
    return this.addJob(jobType, data, {
      ...customOptions,
      priority,
    });
  }
}

export default ProducerService;
