import mongoose from "mongoose";
declare const EmailLog: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<{
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & Omit<{
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
} | {
    [x: string]: mongoose.SchemaDefinitionProperty<any, any, mongoose.Document<unknown, {}, {
        type: "verification" | "passwordReset" | "welcome" | "notification";
        to: string;
        subject: string;
        status: "bounced" | "failed" | "sent" | "delivered" | "queued";
        provider: string;
        error?: string;
        sentAt?: NativeDate;
        deliveredAt?: NativeDate;
        bouncedAt?: NativeDate;
        failedAt?: NativeDate;
        bounceReason?: string;
        metadata?: any;
        userId?: mongoose.Types.ObjectId;
        messageId?: string;
        bounceType?: "hard" | "soft" | "complaint";
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.ResolveSchemaOptions<{
        timestamps: true;
    }>> & Omit<{
        type: "verification" | "passwordReset" | "welcome" | "notification";
        to: string;
        subject: string;
        status: "bounced" | "failed" | "sent" | "delivered" | "queued";
        provider: string;
        error?: string;
        sentAt?: NativeDate;
        deliveredAt?: NativeDate;
        bouncedAt?: NativeDate;
        failedAt?: NativeDate;
        bounceReason?: string;
        metadata?: any;
        userId?: mongoose.Types.ObjectId;
        messageId?: string;
        bounceType?: "hard" | "soft" | "complaint";
    } & mongoose.DefaultTimestampProps & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, {
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    status: "bounced" | "failed" | "sent" | "delivered" | "queued";
    provider: string;
    error?: string;
    sentAt?: NativeDate;
    deliveredAt?: NativeDate;
    bouncedAt?: NativeDate;
    failedAt?: NativeDate;
    bounceReason?: string;
    metadata?: any;
    userId?: mongoose.Types.ObjectId;
    messageId?: string;
    bounceType?: "hard" | "soft" | "complaint";
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default EmailLog;
//# sourceMappingURL=email-log.model.d.ts.map