import mongoose from "mongoose";
declare const AuditLog: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<{
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
}, {
    id: string;
}, {
    timestamps: false;
}> & Omit<{
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: false;
}, {
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
}, mongoose.Document<unknown, {}, {
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
}, {
    id: string;
}, mongoose.ResolveSchemaOptions<{
    timestamps: false;
}>> & Omit<{
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
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
        timestamp: NativeDate;
        userId: mongoose.Types.ObjectId;
        status: "failure" | "success";
        action: string;
        resource: string;
        ip: string;
        metadata?: any;
        resourceId?: string;
        userAgent?: string;
    }, {
        id: string;
    }, mongoose.ResolveSchemaOptions<{
        timestamps: false;
    }>> & Omit<{
        timestamp: NativeDate;
        userId: mongoose.Types.ObjectId;
        status: "failure" | "success";
        action: string;
        resource: string;
        ip: string;
        metadata?: any;
        resourceId?: string;
        userAgent?: string;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, {
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    timestamp: NativeDate;
    userId: mongoose.Types.ObjectId;
    status: "failure" | "success";
    action: string;
    resource: string;
    ip: string;
    metadata?: any;
    resourceId?: string;
    userAgent?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default AuditLog;
//# sourceMappingURL=audit-log.model.d.ts.map