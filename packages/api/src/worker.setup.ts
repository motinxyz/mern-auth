import { QUEUE_NAMES, WORKER_CONFIG } from "@auth/queues";
import { getRedisService } from "@auth/app-bootstrap";
import WorkerService from "@auth/worker";
import { createEmailJobConsumer } from "@auth/worker/consumers/email";
import { API_MESSAGES } from "./constants/api.messages.js";
import type {
  ILogger,
  IDatabaseService,
  IEmailService,
  ISentry,
  IRedisConnection
} from "@auth/contracts";

/**
 * Options for starting the worker service
 */
export interface StartWorkerOptions {
  logger: ILogger;
  databaseService: IDatabaseService;
  emailService: IEmailService;
  sentry: ISentry;
}

/**
 * Initializes and starts the worker service in the same process.
 * 
 * @param options - Configuration options for the worker
 * @returns The started worker service instance
 */
export async function startWorker({
  logger,
  databaseService,
  emailService,
  sentry,
}: StartWorkerOptions): Promise<WorkerService> {
  // Create worker service instance for this process
  // Get Redis connection via factory pattern
  const workerService = new WorkerService({
    logger,
    redisConnection: getRedisService() as unknown as IRedisConnection,
    databaseService,
    initServices: [], // Services are already initialized in @auth/config
    sentry,
  });

  // Create email consumer using factory pattern
  const emailJobConsumer = createEmailJobConsumer({
    emailService,
    logger,
  });

  // Register email processor with retry strategy
  workerService.registerProcessor({
    queueName: QUEUE_NAMES.EMAIL,
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
  logger.info({ module: "worker" }, API_MESSAGES.WORKER_STARTED);

  return workerService;
}
