/**
 * Migration: 001 - Add normalizedEmail field
 *
 * This migration adds the normalizedEmail field to existing users
 * to support Gmail dot-ignoring and prevent duplicate accounts
 */
import mongoose from "mongoose";
import type { ILogger } from "@auth/contracts";
export declare function up(db: mongoose.mongo.Db, session: mongoose.ClientSession, logger: ILogger): Promise<void>;
export declare function down(db: mongoose.mongo.Db, session: mongoose.ClientSession, logger: ILogger): Promise<void>;
//# sourceMappingURL=001-add-normalized-email.migration.d.ts.map