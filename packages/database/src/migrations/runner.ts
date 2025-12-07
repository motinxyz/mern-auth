import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Migration from "../models/migration.model.js";
import { getLogger } from "@auth/config";
import type { ILogger } from "@auth/contracts";

interface MigrationModule {
  up(db: mongoose.mongo.Db, session: mongoose.ClientSession, logger: ILogger): Promise<void>;
  down(db: mongoose.mongo.Db, session: mongoose.ClientSession, logger: ILogger): Promise<void>;
}

const logger = getLogger();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Production-Grade Migration Runner
 *
 * Features:
 * - Tracks applied migrations in database
 * - Runs migrations in order
 * - Supports rollback
 * - Transaction support for safety
 */

class MigrationRunner {
  public migrationsDir: string;

  constructor() {
    this.migrationsDir = __dirname;
  }

  /**
   * Get all migration files sorted by name
   */
  async getMigrationFiles() {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const files = await fs.readdir(this.migrationsDir);
    return files.filter((f) => f.endsWith(".migration.js")).sort(); // Migrations run in alphabetical order
  }

  /**
   * Get list of applied migrations from database
   */
  async getAppliedMigrations() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applied = await Migration.find({ status: "applied" } as any).sort({
      name: 1,
    });
    return new Set(applied.map((m) => m.name));
  }

  /**
   * Run all pending migrations
   */
  async up() {
    logger.info("🔄 Starting database migrations...");

    const migrationFiles = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();

    const pendingMigrations = migrationFiles.filter(
      (file) => !appliedMigrations.has(file)
    );

    if (pendingMigrations.length === 0) {
      logger.info("✅ No pending migrations");
      return;
    }

    logger.info(`📋 Found ${pendingMigrations.length} pending migration(s)`);

    for (const file of pendingMigrations) {
      await this.runMigration(file, "up");
    }

    logger.info("✅ All migrations completed successfully");
  }

  /**
   * Rollback the last migration
   */
  async down() {
    logger.info("⏪ Rolling back last migration...");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appliedMigrations = await Migration.find({ status: "applied" } as any)
      .sort({ appliedAt: -1 })
      .limit(1);

    if (appliedMigrations.length === 0) {
      logger.info("ℹ️  No migrations to rollback");
      return;
    }

    const lastMigration = appliedMigrations[0];
    await this.runMigration(lastMigration.name, "down");

    logger.info("✅ Rollback completed successfully");
  }

  /**
   * Run a specific migration
   */
  async runMigration(filename: string, direction: "up" | "down" = "up") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info(`${direction === "up" ? "⬆️" : "⬇️"} Running: ${filename}`);

      const migrationPath = path.join(this.migrationsDir, filename);
      const migration = await import(migrationPath) as Partial<MigrationModule>;
      // eslint-disable-next-line security/detect-object-injection
      const runFn = migration[direction];
      if (!runFn) {
        throw new Error(
          `Migration ${filename} does not export '${direction}' function`
        );
      }

      // Run the migration
      if (mongoose.connection.db) {
        await runFn(mongoose.connection.db, session, logger);
      }

      // Update migration status
      if (direction === "up") {
        await Migration.create([{ name: filename, status: "applied" }], {
          session,
        });
      } else {
        await Migration.deleteOne({ name: filename }, { session });
      }

      await session.commitTransaction();
      logger.info(`✅ ${filename} completed`);
    } catch (error) {
      await session.abortTransaction();
      logger.error({ err: error }, `❌ Migration ${filename} failed`);

      // Record failure
      await Migration.findOneAndUpdate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: filename } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { status: "failed", error: error instanceof Error ? error.message : String(error) } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { upsert: true } as any
      );

      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get migration status
   */
  async status() {
    const migrationFiles = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();

    logger.info("\n📊 Migration Status:\n");

    for (const file of migrationFiles) {
      const status = appliedMigrations.has(file) ? "✅ Applied" : "⏳ Pending";
      logger.info(`${status} - ${file}`);
    }

    logger.info("");
  }
}

export default new MigrationRunner();
