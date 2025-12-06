/**
 * Migration: 001 - Add normalizedEmail field
 *
 * This migration adds the normalizedEmail field to existing users
 * to support Gmail dot-ignoring and prevent duplicate accounts
 */
export declare function up(db: any, session: any): Promise<void>;
export declare function down(db: any, session: any): Promise<void>;
//# sourceMappingURL=001-add-normalized-email.migration.d.ts.map