import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Migration from "../models/migration.model.js";
import { getLogger } from "@auth/config";

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
    const applied = await Migration.find({ status: "applied" }).sort({
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

    const appliedMigrations = await Migration.find({ status: "applied" })
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
  async runMigration(filename, direction = "up") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info(`${direction === "up" ? "⬆️" : "⬇️"} Running: ${filename}`);

      const migrationPath = path.join(this.migrationsDir, filename);
      const migration = await import(migrationPath);

      // eslint-disable-next-line security/detect-object-injection
      if (!migration[direction]) {
        throw new Error(
          `Migration ${filename} does not export '${direction}' function`
        );
      }

      // Run the migration
      // eslint-disable-next-line security/detect-object-injection
      await migration[direction](mongoose.connection.db, session);

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
      logger.error(`❌ Migration ${filename} failed:`, error);

      // Record failure
      await Migration.findOneAndUpdate(
        { name: filename },
        { status: "failed", error: error.message },
        { upsert: true }
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
