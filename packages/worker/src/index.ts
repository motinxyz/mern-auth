#!/usr/bin/env node

/**
 * Worker CLI
 * Starts workers with registered processors
 */
import {
  initializeTracing,
  initializeMetrics,
} from "@auth/observability";

// Initialize tracing (must be first!)
initializeTracing();
initializeMetrics();

import {
  config,
  getLogger,
  initI18n,
  getRedisConnection,
  QUEUE_NAMES,
} from "@auth/config";
import { EmailService, ProviderService, type EmailServiceConfig } from "@auth/email";
import DatabaseService from "@auth/database";
import type { IRedisConnection } from "@auth/contracts";
import WorkerService from "./worker.service.js";
import { createEmailJobConsumer } from "./consumers/email.consumer.js";

const logger = getLogger();

async function main(): Promise<void> {
  try {
    // Initialize i18n first
    await initI18n();

    // Create database service
    const databaseService = new DatabaseService({ config, logger });

    // Create email service config (subset of full config)
    const emailConfig: EmailServiceConfig = {
      emailFrom: config.emailFrom ?? "noreply@example.com",
      clientUrl: config.clientUrl,
      verificationTokenExpiresIn: config.verificationTokenExpiresIn,
    };

    // Create provider service for email
    const providerService = new ProviderService({
      config: {
        resendApiKey: config.resendApiKey,
        resendWebhookSecret: config.resendWebhookSecret,
        mailersendApiKey: config.mailersendApiKey,
        mailersendWebhookSecret: config.mailersendWebhookSecret,
        mailersendEmailFrom: config.mailersendEmailFrom,
      },
      logger,
    });

    // EmailLogRepository returns IEmailLog POJOs via contract-compliant mapping
    const emailLogRepository = databaseService.emailLogRepository;

    // Create email service with DI
    const emailService = new EmailService({
      config: emailConfig,
      logger,
      emailLogRepository,
      providerService,
    });

    // Create worker service with DI
    // DatabaseService implements IDatabaseService - no cast needed
    // Get Redis connection via factory
    const workerService = new WorkerService({
      logger,
      redisConnection: getRedisConnection() as IRedisConnection,
      databaseService,
      initServices: [
        async () => { await emailService.initialize(); },
      ],
    });

    // Create email consumer using factory pattern
    const emailJobConsumer = createEmailJobConsumer({
      emailService,
      logger,
    });

    // Register email processor with retry strategy
    // Type T is inferred as generic argument matching emailJobConsumer
    workerService.registerProcessor({
      queueName: QUEUE_NAMES.EMAIL,
      processor: emailJobConsumer,
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
    logger.fatal(`Failed to start worker: ${errorMessage}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Fatal error:", errorMessage);
  process.exit(1);
});
