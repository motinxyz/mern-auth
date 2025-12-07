/**
 * Production-Grade Migration Runner
 *
 * Features:
 * - Tracks applied migrations in database
 * - Runs migrations in order
 * - Supports rollback
 * - Transaction support for safety
 */
declare class MigrationRunner {
    migrationsDir: string;
    constructor();
    /**
     * Get all migration files sorted by name
     */
    getMigrationFiles(): Promise<string[]>;
    /**
     * Get list of applied migrations from database
     */
    getAppliedMigrations(): Promise<Set<any>>;
    /**
     * Run all pending migrations
     */
    up(): Promise<void>;
    /**
     * Rollback the last migration
     */
    down(): Promise<void>;
    /**
     * Run a specific migration
     */
    runMigration(filename: string, direction?: "up" | "down"): Promise<void>;
    /**
     * Get migration status
     */
    status(): Promise<void>;
}
declare const _default: MigrationRunner;
export default _default;
//# sourceMappingURL=runner.d.ts.map