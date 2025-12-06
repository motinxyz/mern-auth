#!/usr/bin/env node
/**
 * Worker CLI
 * Example: How to start workers with different processors
 */
import { config, getLogger, initI18n, redisConnection, QUEUE_NAMES, } from "@auth/config";
const logger = getLogger();
import { EmailService } from "@auth/email";
import DatabaseService from "@auth/database";
import WorkerService from "./worker.service.js";
import { createEmailJobConsumer, EmailConsumer, } from "./consumers/email.consumer.js";
async function main() {
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
        const workerService = new WorkerService({
            logger,
            redisConnection,
            databaseService,
            initServices: [
                // Initialize email service
                async () => await emailService.initialize(),
            ],
        });
        // Create email consumer using factory pattern (with DI)
        const emailJobConsumer = createEmailJobConsumer({
            emailService,
            logger,
        });
        // Register email processor with retry strategy
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
        // You can register more processors here:
        // workerService.registerProcessor({
        //   queueName: QUEUE_NAMES.SMS,
        //   processor: smsJobConsumer,
        //   workerConfig: { attempts: 5, backoff: { type: "exponential", delay: 1000 } },
        //   deadLetterQueueName: QUEUE_NAMES.SMS_DEAD_LETTER,
        // });
        // Setup graceful shutdown
        workerService.setupGracefulShutdown();
        // Start the worker
        await workerService.start();
    }
    catch (error) {
        logger.fatal("Failed to start worker", error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map