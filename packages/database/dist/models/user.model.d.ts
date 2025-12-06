import mongoose from "mongoose";
/**
 * @type {mongoose.Model<IUser>}
 */
declare const User: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<{
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & Omit<{
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
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
        name: string;
        email: string;
        normalizedEmail: string;
        password: string;
        role: string;
        isVerified: boolean;
        emailValid: boolean;
        emailComplaint: boolean;
        emailBounceReason?: string;
        emailBouncedAt?: NativeDate;
        emailComplaintAt?: NativeDate;
    } & mongoose.DefaultTimestampProps, {
        id: string;
    }, mongoose.ResolveSchemaOptions<{
        timestamps: true;
    }>> & Omit<{
        name: string;
        email: string;
        normalizedEmail: string;
        password: string;
        role: string;
        isVerified: boolean;
        emailValid: boolean;
        emailComplaint: boolean;
        emailBounceReason?: string;
        emailBouncedAt?: NativeDate;
        emailComplaintAt?: NativeDate;
    } & mongoose.DefaultTimestampProps & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, {
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    name: string;
    email: string;
    normalizedEmail: string;
    password: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailComplaint: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: NativeDate;
    emailComplaintAt?: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default User;
//# sourceMappingURL=user.model.d.ts.map