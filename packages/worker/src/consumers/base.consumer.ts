import {
  createSpanLink,
  withSpan,
  addSpanAttributes,
  hashSensitiveData,
} from "@auth/utils";
import type { ILogger, IJob, JobResult, JobData } from "@auth/contracts";

interface BaseConsumerOptions {
  logger: ILogger;
  name?: string;
}

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
  protected readonly logger: ILogger;
  protected readonly name: string;

  constructor(options: BaseConsumerOptions) {
    if (options.logger === undefined) {
      throw new Error("logger is required for BaseConsumer");
    }
    this.logger = options.logger;
    this.name = options.name ?? this.constructor.name;
  }

  /**
   * Create a child logger with job context
   */
  protected createJobLogger(job: IJob, jobType: string): ILogger {
    return this.logger.child({
      module: this.name,
      jobId: job.id,
      jobType,
    });
  }

  /**
   * Wrap job processing in a span with trace context linking
   */
  protected async withJobSpan<T extends JobData, R extends JobResult>(
    job: IJob<T>,
    spanName: string,
    processor: () => Promise<R>
  ): Promise<R> {
    const jobData = job.data as { traceContext?: { traceId: string; spanId: string } };
    const traceContext = jobData.traceContext;
    const links = traceContext !== undefined ? [createSpanLink(traceContext)] : [];

    return withSpan(
      spanName,
      async () => {
        // Add common job attributes
        addSpanAttributes({
          "job.id": job.id,
          "job.type": (job.data as { type?: string }).type ?? "unknown",
          "job.attempt": job.attemptsMade,
        });

        return processor();
      },
      { links, tracerName: "auth-worker", component: "worker" }
    );
  }

  /**
   * Hash sensitive data for safe logging/tracing
   */
  protected hashSensitive(data: string): string {
    return hashSensitiveData(data);
  }

  /**
   * Add custom span attributes
   */
  protected addAttributes(attributes: Record<string, string | number | boolean>): void {
    addSpanAttributes(attributes);
  }
}

export default BaseConsumer;
