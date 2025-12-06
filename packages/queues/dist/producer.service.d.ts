import type { ILogger } from "@auth/contracts";
/**
 * Producer Service
 * Generic job producer with DI
 */
declare class ProducerService {
    queueService: any;
    logger: ILogger;
    constructor(options?: any);
    /**
     * Add a job to the queue
     * @param {string} jobType - The job type
     * @param {object} data - The job data
     * @param {object} customOptions - Optional BullMQ job options
     */
    addJob(jobType: any, data: any, customOptions?: {}): Promise<any>;
    /**
     * Add a job with deduplication (using jobId)
     * @param {string} jobType - The job type
     * @param {object} data - The job data
     * @param {string} deduplicationKey - Unique key for deduplication
     * @param {object} customOptions - Optional BullMQ job options
     */
    addJobWithDeduplication(jobType: any, data: any, deduplicationKey: any, customOptions?: {}): Promise<any>;
    /**
     * Add a delayed job
     * @param {string} jobType - The job type
     * @param {object} data - The job data
     * @param {number} delayMs - Delay in milliseconds
     * @param {object} customOptions - Optional BullMQ job options
     */
    addDelayedJob(jobType: any, data: any, delayMs: any, customOptions?: {}): Promise<any>;
    /**
     * Add a job with priority
     * @param {string} jobType - The job type
     * @param {object} data - The job data
     * @param {number} priority - Priority (lower number = higher priority)
     * @param {object} customOptions - Optional BullMQ job options
     */
    addPriorityJob(jobType: any, data: any, priority: any, customOptions?: {}): Promise<any>;
}
export default ProducerService;
//# sourceMappingURL=producer.service.d.ts.map