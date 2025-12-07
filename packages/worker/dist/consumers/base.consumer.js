import { createSpanLink, withSpan, addSpanAttributes, hashSensitiveData, } from "@auth/utils";
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
    logger;
    name;
    constructor(options) {
        if (options.logger === undefined) {
            throw new Error("logger is required for BaseConsumer");
        }
        this.logger = options.logger;
        this.name = options.name ?? this.constructor.name;
    }
    /**
     * Create a child logger with job context
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
     */
    async withJobSpan(job, spanName, processor) {
        const jobData = job.data;
        const traceContext = jobData.traceContext;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const links = traceContext !== undefined ? [createSpanLink(traceContext)] : [];
        return withSpan(spanName, async () => {
            // Add common job attributes
            addSpanAttributes({
                "job.id": job.id,
                "job.type": job.data.type ?? "unknown",
                "job.attempt": job.attemptsMade,
            });
            return processor();
        }, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            links: links, tracerName: "auth-worker", component: "worker"
        });
    }
    /**
     * Hash sensitive data for safe logging/tracing
     */
    hashSensitive(data) {
        return hashSensitiveData(data);
    }
    /**
     * Add custom span attributes
     */
    addAttributes(attributes) {
        addSpanAttributes(attributes);
    }
}
export default BaseConsumer;
//# sourceMappingURL=base.consumer.js.map