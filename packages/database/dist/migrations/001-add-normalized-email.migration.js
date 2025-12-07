/**
 * Migration: 001 - Add normalizedEmail field
 *
 * This migration adds the normalizedEmail field to existing users
 * to support Gmail dot-ignoring and prevent duplicate accounts
 */
import mongoose from "mongoose";
import { normalizeEmail } from "@auth/utils";
export async function up(db, session, logger) {
    const users = await db.collection("users").find({}).toArray();
    for (const user of users) {
        const normalizedEmail = normalizeEmail(user.email);
        await db
            .collection("users")
            .updateOne({ _id: user._id }, { $set: { normalizedEmail } }, { session });
    }
    // Create unique index on normalizedEmail
    await db
        .collection("users")
        .createIndex({ normalizedEmail: 1 }, { unique: true, session });
    logger.info(`✅ Normalized ${users.length} user emails`);
}
export async function down(db, session, logger) {
    // Drop the unique index
    await db.collection("users").dropIndex("normalizedEmail_1", { session });
    // Remove the normalizedEmail field
    await db
        .collection("users")
        .updateMany({}, { $unset: { normalizedEmail: "" } }, { session });
    logger.info("✅ Removed normalizedEmail field");
}
//# sourceMappingURL=001-add-normalized-email.migration.js.map