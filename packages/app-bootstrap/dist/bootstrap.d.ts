declare let databaseService: any;
declare let emailService: any;
/**
 * Get or create DatabaseService singleton
 */
export declare function getDatabaseService(): any;
/**
 * Get or create EmailService singleton
 */
export declare function getEmailService(): any;
/**
 * Get or create Queue Services singletons
 */
export declare function getQueueServices(): any;
export { databaseService, emailService };
/**
 * Initializes common application services (i18n, database, email).
 * Handles parallel initialization and robust error reporting.
 * @returns {Promise<{databaseService: DatabaseService}>} Services for shutdown
 */
export declare function initializeCommonServices(): Promise<{
    databaseService: any;
}>;
/**
 * Initializes all necessary services in parallel and starts the API server.
 * @param {Express.Application} app - The Express application instance.
 * @param {Function} [onShutdown] - Optional callback to run during graceful shutdown.
 * @returns {Promise<import('http').Server>} The HTTP server instance.
 */
export declare function bootstrapApplication(app: any, onShutdown: any): Promise<any>;
//# sourceMappingURL=bootstrap.d.ts.map