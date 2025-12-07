#!/usr/bin/env node

/**
 * Worker CLI
 * Example: How to start workers with different processors
 */
import {
  config,
  getLogger,
  initI18n,
  redisConnection,
  QUEUE_NAMES,
} from "@auth/config";
import { EmailService } from "@auth/email";
import DatabaseService from "@auth/database";
import WorkerService from "./worker.service.js";
import { createEmailJobConsumer } from "./consumers/email.consumer.js";
import type { IJob } from "@auth/contracts";

const logger = getLogger();

async function main(): Promise<void> {
  try {
    // Initialize i18n first
    await initI18n();

    // Create database service
    const databaseService = new DatabaseService({ config, logger });

    // Create email service with DI
    const emailService = new EmailService({
      config,
      logger,
      emailLogRepository: databaseService.emailLogs,
    });

    // Create worker service with DI
    // Note: Using type assertion as implementations may not exactly match interfaces
    const workerService = new WorkerService({
      logger,
      redisConnection: redisConnection as unknown,
      databaseService: databaseService as unknown as Parameters<typeof WorkerService>[0]["databaseService"],
      initServices: [
        // Initialize email service
        async () => { await emailService.initialize(); },
      ],
    });

    // Create email consumer using factory pattern (with DI)
    // Type assertion needed as EmailService implementation differs from contract
    const emailJobConsumer = createEmailJobConsumer({
      emailService: emailService as Parameters<typeof createEmailJobConsumer>[0]["emailService"],
      logger,
    });

    // Register email processor with retry strategy
    workerService.registerProcessor({
      queueName: QUEUE_NAMES.EMAIL,
      processor: emailJobConsumer as (job: IJob) => Promise<unknown>,
      workerConfig: {
        concurrency: config.worker.concurrency,
        attempts: config.worker.maxRetries,
        backoff: {
          type: "exponential",
          delay: config.worker.backoffDelay,
        },
        stalledInterval: config.worker.stalledInterval,
        disableStalledJobCheck: config.worker.disableStalledJobCheck,
      },
      deadLetterQueueName: QUEUE_NAMES.EMAIL_DEAD_LETTER,
    });

    // Setup graceful shutdown
    workerService.setupGracefulShutdown();

    // Start the worker
    await workerService.start();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.fatal("Failed to start worker", errorMessage);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Fatal error:", errorMessage);
  process.exit(1);
});
