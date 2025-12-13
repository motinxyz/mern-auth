import type { Redis } from "ioredis";
import QueueProducerService from "./queue-producer.service.js";
import ProducerService from "./producer.service.js";
import { QUEUE_NAMES } from "./constants.js";
import { config } from "@auth/config";
import type { ILogger } from "@auth/contracts";

/**
 * Queue Services Factory Options
 *
 * All options are REQUIRED - no lazy getters or globals.
 * This follows DI best practices.
 */
export interface CreateQueueServicesOptions {
  /** Redis connection - REQUIRED */
  readonly connection: Redis;
  /** Logger instance - REQUIRED */
  readonly logger: ILogger;
  /** Queue name override (optional, defaults to EMAIL) */
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
 * Creates and configures queue producer services with explicit DI.
 * No global state, no lazy getters - pure dependency injection.
 *
 * @param options - Required connection and logger
 */
export function createQueueServices(options: CreateQueueServicesOptions): QueueServices {
  const { connection, logger } = options;
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

// Lazy singleton for backward compatibility during migration
let queueServicesInstance: QueueServices | null = null;

/**
 * Initialize Queue Services singleton
 *
 * Must be called once from composition root before getQueueServices().
 * This is a migration helper - prefer createQueueServices() for new code.
 */
export function initQueueServices(options: CreateQueueServicesOptions): QueueServices {
  queueServicesInstance = createQueueServices(options);
  return queueServicesInstance;
}

/**
 * Get Queue Services singleton
 *
 * @throws Error if initQueueServices() was not called first
 */
export function getQueueServices(): QueueServices {
  if (!queueServicesInstance) {
    throw new Error(
      "Queue services not initialized. Call initQueueServices() from @auth/app-bootstrap before using getQueueServices()."
    );
  }
  return queueServicesInstance;
}

/**
 * Reset singleton (for testing only)
 */
export function resetQueueServices(): void {
  queueServicesInstance = null;
}

