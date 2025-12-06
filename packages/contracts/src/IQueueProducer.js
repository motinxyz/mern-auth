/**
 * IQueueProducer - Abstract interface for queue operations
 *
 * Implementations: QueueProducerService (BullMQ)
 *
 * @abstract
 */
export class IQueueProducer {
  /**
   * Add a job to the queue
   * @param {string} type - Job type identifier
   * @param {object} data - Job payload
   * @param {object} [options] - Job options (jobId, delay, etc.)
   * @returns {Promise<object>} - Created job
   */
  async addJob(type, data, options = {}) {
    throw new Error("IQueueProducer.addJob() must be implemented");
  }

  /**
   * Get queue health status
   * @returns {Promise<{healthy: boolean, circuitBreaker?: object}>}
   */
  async getHealth() {
    throw new Error("IQueueProducer.getHealth() must be implemented");
  }
}
