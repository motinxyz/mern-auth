import {
  createSpanLink,
  withSpan,
  addSpanAttributes,
  hashSensitiveData,
} from "@auth/utils";
import type { ILogger } from "@auth/contracts";

/**
 * Base Consumer
 * Provides common functionality for all job consumers:
 * - Tracing with span links to original request
 * - Structured logging with job context
 * - Error handling with consistent error wrapping
 *
 * Concrete consumers should extend this class or use the factory pattern.
 */
class BaseConsumer {
  /**
   * @param {object} options
   * @param {object} options.logger - Pino logger instance
   * @param {string} options.name - Consumer name for tracing/logging
   */
  logger: ILogger;
  name: string;

  constructor(options: any) {
    if (!options.logger) {
      throw new Error("logger is required for BaseConsumer");
    }
    this.logger = options.logger;
    this.name = options.name || this.constructor.name;
  }

  /**
   * Create a child logger with job context
   * @param {object} job - BullMQ job
   * @param {string} jobType - Type of job being processed
   * @returns {object} Child logger with context
   */
  createJobLogger(job, jobType) {
    return this.logger.child({
      module: this.name,
      jobId: job.id,
      jobType,
    });
  }

  /**
   * Wrap job processing in a span with trace context linking
   * @param {object} job - BullMQ job
   * @param {string} spanName - Name for the span
   * @param {Function} processor - Async function to execute
   * @returns {Promise<any>} Result of processor
   */
  async withJobSpan(job, spanName, processor) {
    const { traceContext } = job.data;
    const links = traceContext ? [createSpanLink(traceContext)] : [];

    return withSpan(
      spanName,
      async () => {
        // Add common job attributes
        addSpanAttributes({
          "job.id": job.id,
          "job.type": job.data.type,
          "job.attempt": job.attemptsMade || 0,
        });

        return processor();
      },
      { links, tracerName: "auth-worker", component: "worker" }
    );
  }

  /**
   * Hash sensitive data for safe logging/tracing
   * @param {string} data - Sensitive data to hash
   * @returns {string} Hashed data
   */
  hashSensitive(data) {
    return hashSensitiveData(data);
  }

  /**
   * Add custom span attributes
   * @param {object} attributes - Key-value pairs to add
   */
  addAttributes(attributes) {
    addSpanAttributes(attributes);
  }
}

export default BaseConsumer;
