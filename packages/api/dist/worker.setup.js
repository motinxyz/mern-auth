import { redisConnection, QUEUE_NAMES, WORKER_CONFIG } from "@auth/config";
import WorkerService from "@auth/worker";
import { createEmailJobConsumer } from "@auth/worker/consumers/email";
import { API_MESSAGES } from "./constants/api.messages.js";
/**
 * Initializes and starts the worker service in the same process.
 * @param {object} options
 * @param {object} options.logger - Logger instance
 * @param {object} options.databaseService - Database service instance
 * @param {object} options.emailService - Email service instance
 * @param {object} options.sentry - Sentry instance
 * @returns {Promise<WorkerService>} The started worker service
 */
export async function startWorker({ logger, databaseService, emailService, sentry, }) {
    // Create worker service instance for this process
    const workerService = new WorkerService({
        logger,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        redisConnection: redisConnection,
        databaseService,
        initServices: [], // Services are already initialized in @auth/config
        sentry,
    });
    // Create email consumer using factory pattern
    // CRITICAL FIX: Pass both emailService and logger
    const emailJobConsumer = createEmailJobConsumer({
        emailService,
        logger,
    });
    // Register email processor with retry strategy
    workerService.registerProcessor({
        queueName: QUEUE_NAMES.EMAIL,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processor: emailJobConsumer,
        workerConfig: {
            concurrency: WORKER_CONFIG.concurrency,
            limiter: WORKER_CONFIG.limiter,
            stalledInterval: WORKER_CONFIG.settings.stalledInterval,
            lockDuration: WORKER_CONFIG.settings.lockDuration,
            drainDelay: WORKER_CONFIG.settings.drainDelay,
            removeOnComplete: WORKER_CONFIG.retention.removeOnComplete,
        },
    });
    // Start worker
    await workerService.start();
    logger.info({ module: "worker", processorCount: workerService.getProcessors().length }, API_MESSAGES.WORKER_STARTED);
    return workerService;
}
//# sourceMappingURL=worker.setup.js.map