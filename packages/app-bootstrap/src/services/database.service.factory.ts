import DatabaseService from "@auth/database";
import { config, getLogger } from "@auth/config";
import type { IDatabaseService } from "@auth/contracts";

/**
 * Database Service Factory
 *
 * Creates and configures the DatabaseService instance.
 * Returns a fully typed IDatabaseService for contract compliance.
 */
export function createDatabaseService(): IDatabaseService {
  const logger = getLogger();

  return new DatabaseService({
    config,
    logger,
  });
}
