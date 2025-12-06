import mongoose from "mongoose";
declare const Migration: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<{
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
}, {
    id: string;
}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & Omit<{
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
} | {
    [x: string]: mongoose.SchemaDefinitionProperty<any, any, mongoose.Document<unknown, {}, {
        name: string;
        status: "failed" | "pending" | "applied";
        appliedAt: NativeDate;
        error?: string;
    }, {
        id: string;
    }, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & Omit<{
        name: string;
        status: "failed" | "pending" | "applied";
        appliedAt: NativeDate;
        error?: string;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, {
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    name: string;
    status: "failed" | "pending" | "applied";
    appliedAt: NativeDate;
    error?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Migration;
//# sourceMappingURL=migration.model.d.ts.map