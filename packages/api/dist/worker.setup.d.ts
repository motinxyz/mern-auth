import WorkerService from "@auth/worker";
/**
 * Initializes and starts the worker service in the same process.
 * @param {object} options
 * @param {object} options.logger - Logger instance
 * @param {object} options.databaseService - Database service instance
 * @param {object} options.emailService - Email service instance
 * @param {object} options.sentry - Sentry instance
 * @returns {Promise<WorkerService>} The started worker service
 */
export declare function startWorker({ logger, databaseService, emailService, sentry, }: {
    logger: any;
    databaseService: any;
    emailService: any;
    sentry: any;
}): Promise<WorkerService>;
//# sourceMappingURL=worker.setup.d.ts.map