import QueueProducerService from "./queue-producer.service.js";
import ProducerService from "./producer.service.js";
import { getLogger, redisConnection, QUEUE_NAMES, config } from "@auth/config";
/**
 * Queue Services Factory
 * Creates and configures queue producer services with proper DI.
 *
 * @param {object} options - Optional overrides
 * @param {object} options.connection - Redis connection (default: from config)
 * @param {object} options.logger - Logger instance (default: from config)
 * @param {string} options.queueName - Queue name (default: EMAIL from config)
 * @returns {object} Queue services
 */
export function createQueueServices(options = {}) {
    const logger = options.logger || getLogger();
    const connection = options.connection || redisConnection;
    const queueName = options.queueName || QUEUE_NAMES.EMAIL;
    // Create email queue producer
    const emailQueueProducer = new QueueProducerService({
        queueName,
        connection,
        logger,
        circuitBreakerTimeout: config.redis?.circuitBreakerTimeout || 3000,
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
// Lazy singleton for backward compatibility
let queueServices = null;
/**
 * Get or create Queue Services singletons
 * Note: Prefer createQueueServices() for new code (better testability)
 */
export function getQueueServices() {
    if (!queueServices) {
        queueServices = createQueueServices();
    }
    return queueServices;
}
/**
 * Reset singleton (for testing only)
 */
export function resetQueueServices() {
    queueServices = null;
}
//# sourceMappingURL=instance.js.map