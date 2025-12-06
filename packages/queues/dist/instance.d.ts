import QueueProducerService from "./queue-producer.service.js";
import ProducerService from "./producer.service.js";
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
export declare function createQueueServices(options?: any): {
    emailQueueProducer: QueueProducerService;
    emailProducerService: ProducerService;
};
/**
 * Get or create Queue Services singletons
 * Note: Prefer createQueueServices() for new code (better testability)
 */
export declare function getQueueServices(): any;
/**
 * Reset singleton (for testing only)
 */
export declare function resetQueueServices(): void;
//# sourceMappingURL=instance.d.ts.map