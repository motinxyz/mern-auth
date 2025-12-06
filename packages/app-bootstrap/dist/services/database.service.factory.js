import DatabaseService from "@auth/database";
import { config, getLogger } from "@auth/config";
/**
 * Database Service Factory
 * Creates and configures the DatabaseService instance
 */
export function createDatabaseService() {
    const logger = getLogger();
    return new DatabaseService({
        config,
        logger,
    });
}
//# sourceMappingURL=database.service.factory.js.map