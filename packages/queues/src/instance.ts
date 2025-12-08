import type { Redis } from "ioredis";
import QueueProducerService from "./queue-producer.service.js";
import ProducerService from "./producer.service.js";
import { getLogger, redisConnection, QUEUE_NAMES, config } from "@auth/config";
import type { ILogger } from "@auth/contracts";

/**
 * Queue Services Factory Options
 */
interface CreateQueueServicesOptions {
  readonly connection?: Redis;
  readonly logger?: ILogger;
  readonly queueName?: string;
}

/**
 * Queue Services Result
 */
export interface QueueServices {
  readonly emailQueueProducer: QueueProducerService;
  readonly emailProducerService: ProducerService;
}

/**
 * Queue Services Factory
 *
 * Creates and configures queue producer services with proper DI.
 *
 * @param options - Optional overrides for connection, logger, queueName
 */
export function createQueueServices(options: CreateQueueServicesOptions = {}): QueueServices {
  const logger = options.logger ?? getLogger();
  const connection = options.connection ?? redisConnection;
  const queueName = options.queueName ?? QUEUE_NAMES.EMAIL;

  // Create email queue producer
  const emailQueueProducer = new QueueProducerService({
    queueName,
    connection,
    logger,
    circuitBreakerTimeout: config.redis.circuitBreakerTimeout,
  });

  // Create email producer service (higher-level abstraction)
  const emailProducerService = new ProducerService({
    queueService: emailQueueProducer,
    logger,
  });

  return {
    emailQueueProducer,
    emailProducerService,
  };
}

// Lazy singleton
let queueServices: QueueServices | null = null;

/**
 * Get or create Queue Services singletons
 *
 * Note: Prefer createQueueServices() for new code (better testability)
 */
export function getQueueServices(): QueueServices {
  if (!queueServices) {
    queueServices = createQueueServices();
  }
  return queueServices;
}

/**
 * Reset singleton (for testing only)
 */
export function resetQueueServices(): void {
  queueServices = null;
}
