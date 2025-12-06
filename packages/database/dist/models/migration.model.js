import mongoose from "mongoose";
import { getLogger } from "@auth/config";
const logger = getLogger();
/**
 * Migration tracking schema
 * Keeps track of which migrations have been run
 */
const migrationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["pending", "applied", "failed"],
        default: "applied",
    },
    error: String,
});
const Migration = mongoose.models.Migration || mongoose.model("Migration", migrationSchema);
export default Migration;
//# sourceMappingURL=migration.model.js.map