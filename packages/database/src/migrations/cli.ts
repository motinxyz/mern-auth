#!/usr/bin/env node

/**
 * Migration CLI
 *
 * Usage:
 *   pnpm migrate up      - Run all pending migrations
 *   pnpm migrate down    - Rollback last migration
 *   pnpm migrate status  - Show migration status
 */

import DatabaseService from "../index.js";
import migrationRunner from "./runner.js";
import { config, getLogger, t } from "@auth/config";

const logger = getLogger();

const command = process.argv[2] ?? "status";

async function main() {
  const databaseService = new DatabaseService({ config, logger, t });

  try {
    await databaseService.connect();

    switch (command) {
      case "up":
        await migrationRunner.up();
        break;
      case "down":
        await migrationRunner.down();
        break;
      case "status":
        await migrationRunner.status();
        break;
      default:
        logger.warn("Unknown command. Use: up, down, or status");
        process.exit(1);
    }

    await databaseService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Migration failed");
    await databaseService.disconnect();
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
