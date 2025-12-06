import mongoose from "mongoose";
export interface MigrationDocument extends mongoose.Document {
    name: string;
    appliedAt: Date;
    status: "pending" | "applied" | "failed";
    error?: string;
}
declare const Migration: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default Migration;
//# sourceMappingURL=migration.model.d.ts.map