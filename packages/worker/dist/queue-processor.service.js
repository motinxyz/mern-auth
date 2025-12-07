import { Worker, Queue, Job } from "bullmq";
import { WORKER_MESSAGES, WORKER_ERRORS } from "./constants/worker.messages.js";
import { ConfigurationError } from "@auth/utils";
import { captureJobError } from "./monitoring/sentry.js";
import { workerJobDuration, workerJobTotal, workerActiveJobs, workerDlqTotal, workerStalledTotal, } from "./metrics.js";
/**
 * Generic Queue Processor Service
 * Handles any BullMQ job processing with metrics and health checks
 */
class QueueProcessorService {
    queueName;
    connection;
    processorFn;
    logger;
    workerConfig;
    deadLetterQueueName;
    sentry;
    worker;
    deadLetterQueue;
    metrics;
    constructor(options) {
        if (options.queueName === undefined || options.queueName === "") {
            throw new ConfigurationError(WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "queueName"));
        }
        if (options.connection === undefined) {
            throw new ConfigurationError(WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "connection"));
        }
        if (options.processor === undefined) {
            throw new ConfigurationError(WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "processor"));
        }
        if (options.logger === undefined) {
            throw new ConfigurationError(WORKER_ERRORS.MISSING_CONFIG.replace("{config}", "logger"));
        }
        this.queueName = options.queueName;
        this.connection = options.connection;
        this.processorFn = options.processor;
        this.logger = options.logger.child({ queue: this.queueName });
        this.workerConfig = options.workerConfig ?? this.getDefaultConfig();
        this.deadLetterQueueName = options.deadLetterQueueName;
        this.sentry = options.sentry;
        this.worker = null;
        this.deadLetterQueue = null;
        // Metrics
        this.metrics = {
            processed: 0,
            completed: 0,
            failed: 0,
            active: 0,
            totalProcessingTime: 0,
            lastProcessedAt: null,
        };
    }
    /**
     * Get default worker configuration
     */
    getDefaultConfig() {
        return {
            concurrency: 5,
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
            limiter: { max: 100, duration: 1000 },
            stalledInterval: 60000,
            lockDuration: 60000,
            drainDelay: 500,
            // Retry strategy
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000,
            },
            disableStalledJobCheck: false,
        };
    }
    /**
     * Initialize the queue processor
     */
    async initialize() {
        // Create dead-letter queue if specified
        if (this.deadLetterQueueName !== undefined && this.deadLetterQueueName !== "") {
            this.deadLetterQueue = new Queue(this.deadLetterQueueName, {
                connection: this.connection,
            });
        }
        // Wrap processor with logging and metrics
        const wrappedProcessor = async (job) => {
            const startTime = Date.now();
            this.metrics.active++;
            this.metrics.processed++;
            // Record active job metric
            workerActiveJobs.add(1, { queue: this.queueName });
            const traceId = job.data?.traceContext !== undefined
                ? job.data.traceContext?.traceId
                : undefined;
            const logContext = {
                job: { id: job.id, name: job.name, attempt: job.attemptsMade + 1 },
            };
            if (traceId !== undefined) {
                logContext.traceId = traceId;
            }
            this.logger.info(logContext, WORKER_MESSAGES.JOB_PROCESSING);
            try {
                const jobAsIJob = {
                    id: job.id ?? "",
                    name: job.name,
                    data: job.data,
                    attemptsMade: job.attemptsMade,
                    opts: job.opts,
                };
                const result = await this.processorFn(jobAsIJob);
                const processingTime = Date.now() - startTime;
                this.metrics.totalProcessingTime += processingTime;
                this.metrics.lastProcessedAt = new Date();
                // Record success metrics
                workerJobDuration.record(processingTime / 1000, {
                    queue: this.queueName,
                    status: "success",
                    job_type: job.name,
                });
                workerJobTotal.add(1, {
                    queue: this.queueName,
                    status: "success",
                    job_type: job.name,
                });
                return result;
            }
            finally {
                this.metrics.active--;
                workerActiveJobs.add(-1, { queue: this.queueName });
            }
        };
        // Build worker configuration
        const workerOptions = {
            connection: this.connection,
            concurrency: this.workerConfig.concurrency,
            removeOnComplete: this.workerConfig.removeOnComplete,
            removeOnFail: this.workerConfig.removeOnFail,
            limiter: this.workerConfig.limiter,
            enableReadyEvent: false,
            enableKeyEvents: false,
            lockDuration: this.workerConfig.lockDuration,
            drainDelay: this.workerConfig.drainDelay,
            // Retry configuration
            settings: {
                backoffStrategy: (attemptsMade) => {
                    if (this.workerConfig.backoff?.type === "exponential") {
                        return (this.workerConfig.backoff.delay ?? 1000) * Math.pow(2, attemptsMade);
                    }
                    return this.workerConfig.backoff?.delay ?? 1000;
                },
            },
        };
        // Only add stalledInterval if not disabled
        if (this.workerConfig.disableStalledJobCheck !== true) {
            workerOptions.stalledInterval = this.workerConfig.stalledInterval;
        }
        // Create worker with retry configuration
        this.worker = new Worker(this.queueName, wrappedProcessor, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workerOptions);
        this.setupEventHandlers();
        this.logger.info(`${WORKER_MESSAGES.PROCESSOR_INITIALIZED}: ${this.queueName}`);
    }
    /**
     * Setup event handlers for the worker
     */
    setupEventHandlers() {
        if (this.worker === null)
            return;
        this.worker.on("failed", async (job, err) => {
            this.metrics.failed++;
            // Record failure metric
            workerJobTotal.add(1, {
                queue: this.queueName,
                status: "failed",
                job_type: job?.name ?? "unknown",
            });
            // Capture to Sentry with rich context
            if (this.sentry !== undefined && job !== undefined) {
                captureJobError(err, job);
            }
            const traceId = job?.data !== undefined
                ? job.data?.traceContext?.traceId
                : undefined;
            const logContext = {
                job: {
                    id: job?.id,
                    name: job?.name,
                    attempt: job?.attemptsMade,
                    maxAttempts: this.workerConfig.attempts,
                },
                err: err.message,
            };
            if (traceId !== undefined) {
                logContext.traceId = traceId;
            }
            this.logger.error(logContext, `${WORKER_MESSAGES.JOB_FAILED}: ${err.message}`);
            // Move to DLQ only if max attempts reached
            if (job !== undefined &&
                this.deadLetterQueue !== null &&
                job.attemptsMade >= (this.workerConfig.attempts ?? 3)) {
                await this.deadLetterQueue.add(job.name, job.data, { lifo: true });
                this.logger.warn({ jobId: job.id }, WORKER_MESSAGES.JOB_MOVED_TO_DLQ);
                // Record DLQ metric
                workerDlqTotal.add(1, {
                    queue: this.queueName,
                    job_type: job.name,
                });
            }
        });
        this.worker.on("completed", (job, result) => {
            this.metrics.completed++;
            const traceId = job.data?.traceContext !== undefined
                ? job.data.traceContext?.traceId
                : undefined;
            const logContext = {
                job: { id: job.id, name: job.name },
                result,
            };
            if (traceId !== undefined) {
                logContext.traceId = traceId;
            }
            this.logger.info(logContext, WORKER_MESSAGES.JOB_COMPLETED);
        });
        this.worker.on("progress", (job, progress) => {
            this.logger.debug({ job: { id: job.id, name: job.name }, progress }, WORKER_MESSAGES.JOB_PROGRESS);
        });
        this.worker.on("ready", () => {
            this.logger.info(`${WORKER_MESSAGES.WORKER_READY}: ${this.queueName}`);
        });
        this.worker.on("error", (err) => {
            this.logger.error({ err: err.message }, WORKER_MESSAGES.WORKER_ERROR);
        });
        this.worker.on("stalled", (jobId) => {
            this.logger.warn({ jobId }, WORKER_MESSAGES.JOB_STALLED);
            // Record stalled metric
            workerStalledTotal.add(1, { queue: this.queueName });
        });
    }
    /**
     * Get processor metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            averageProcessingTime: this.metrics.completed > 0
                ? this.metrics.totalProcessingTime / this.metrics.completed
                : 0,
            successRate: this.metrics.processed > 0
                ? (this.metrics.completed / this.metrics.processed) * 100
                : 0,
            failureRate: this.metrics.processed > 0
                ? (this.metrics.failed / this.metrics.processed) * 100
                : 0,
        };
    }
    /**
     * Get health status
     */
    async getHealth() {
        if (this.worker === null) {
            return {
                healthy: false,
                reason: "Worker not initialized",
            };
        }
        try {
            const isRunning = await this.worker.isRunning();
            const isPaused = await this.worker.isPaused();
            return {
                healthy: isRunning && !isPaused,
                queueName: this.queueName,
                isRunning,
                isPaused,
                metrics: this.getMetrics(),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                healthy: false,
                reason: errorMessage,
            };
        }
    }
    /**
     * Pause the worker
     */
    async pause() {
        if (this.worker !== null) {
            await this.worker.pause();
            this.logger.info(`${WORKER_MESSAGES.WORKER_PAUSED}: ${this.queueName}`);
        }
    }
    /**
     * Resume the worker
     */
    async resume() {
        if (this.worker !== null) {
            await this.worker.resume();
            this.logger.info(`${WORKER_MESSAGES.WORKER_RESUMED}: ${this.queueName}`);
        }
    }
    /**
     * Close the worker gracefully
     */
    async close() {
        if (this.worker !== null) {
            await this.worker.close();
            this.logger.info(`${WORKER_MESSAGES.PROCESSOR_CLOSED}: ${this.queueName}`);
        }
        if (this.deadLetterQueue !== null) {
            await this.deadLetterQueue.close();
        }
    }
    /**
     * Get worker instance
     */
    getWorker() {
        return this.worker;
    }
}
export default QueueProcessorService;
//# sourceMappingURL=queue-processor.service.js.map