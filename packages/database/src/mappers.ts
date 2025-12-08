/**
 * Entity Mappers
 * 
 * Convert Mongoose lean documents to contract-compliant POJOs.
 * Uses conditional spreads to satisfy exactOptionalPropertyTypes.
 */
import type { IUser, IEmailLog, IAuditLog } from "@auth/contracts";

/**
 * Convert ObjectId or string to string
 */
function toStringId(id: unknown): string {
    if (id === null || id === undefined) return "";
    return String(id);
}

/**
 * Map a lean user document to IUser
 */
export function mapUserDocument(doc: unknown): IUser | null {
    if (!doc) return null;
    const d = doc as Record<string, unknown>;

    const user: IUser = {
        _id: toStringId(d._id),
        name: d.name as string,
        email: d.email as string,
        password: d.password as string,
        isVerified: Boolean(d.isVerified),
        locale: (d.locale as string) ?? "en",
        createdAt: d.createdAt as Date,
        updatedAt: d.updatedAt as Date,
        // Conditionally add optional properties
        ...(d.emailValid !== undefined ? { emailValid: d.emailValid as boolean } : {}),
        ...(d.emailBounceCount !== undefined ? { emailBounceCount: d.emailBounceCount as number } : {}),
        ...(d.lastEmailBounce !== undefined ? { lastEmailBounce: d.lastEmailBounce as Date } : {}),
        ...(d.emailComplaintReceived !== undefined ? { emailComplaintReceived: d.emailComplaintReceived as boolean } : {}),
        ...(d.lastEmailComplaint !== undefined ? { lastEmailComplaint: d.lastEmailComplaint as Date } : {}),
    };

    return user;
}

/**
 * Map multiple user documents
 */
export function mapUserDocuments(docs: unknown[]): IUser[] {
    return docs.map(d => mapUserDocument(d)).filter((d): d is IUser => d !== null);
}

/**
 * Map a lean email log document to IEmailLog
 */
export function mapEmailLogDocument(doc: unknown): IEmailLog | null {
    if (!doc) return null;
    const d = doc as Record<string, unknown>;

    const emailLog: IEmailLog = {
        _id: toStringId(d._id),
        messageId: (d.messageId as string) ?? "",
        to: (d.to as string) ?? "",
        from: (d.from as string) ?? "",
        subject: (d.subject as string) ?? "",
        status: (d.status as IEmailLog["status"]) ?? "queued",
        createdAt: d.createdAt as Date,
        updatedAt: d.updatedAt as Date,
        // Conditionally add optional properties
        ...(d.userId !== undefined ? { userId: d.userId as string } : {}),
        ...(d.type !== undefined ? { type: d.type as string } : {}),
        ...(d.template !== undefined ? { template: d.template as string } : {}),
        ...(d.provider !== undefined ? { provider: d.provider as string } : {}),
        ...(d.sentAt !== undefined ? { sentAt: d.sentAt as Date } : {}),
        ...(d.deliveredAt !== undefined ? { deliveredAt: d.deliveredAt as Date } : {}),
        ...(d.bouncedAt !== undefined ? { bouncedAt: d.bouncedAt as Date } : {}),
        ...(d.bounceType !== undefined ? { bounceType: d.bounceType as "soft" | "hard" } : {}),
        ...(d.bounceReason !== undefined ? { bounceReason: d.bounceReason as string } : {}),
        ...(d.error !== undefined ? { error: d.error as string } : {}),
        ...(d.metadata !== undefined ? { metadata: d.metadata as Record<string, unknown> } : {}),
    };

    return emailLog;
}

/**
 * Map multiple email log documents
 */
export function mapEmailLogDocuments(docs: unknown[]): IEmailLog[] {
    return docs.map(d => mapEmailLogDocument(d)).filter((d): d is IEmailLog => d !== null);
}

/**
 * Map a lean audit log document to IAuditLog
 */
export function mapAuditLogDocument(doc: unknown): IAuditLog | null {
    if (!doc) return null;
    const d = doc as Record<string, unknown>;

    const auditLog: IAuditLog = {
        _id: toStringId(d._id),
        action: (d.action as string) ?? "",
        resource: (d.resource as string) ?? "",
        success: Boolean(d.success),
        createdAt: d.createdAt as Date,
        // Conditionally add optional properties
        ...(d.userId !== undefined ? { userId: d.userId as string } : {}),
        ...(d.resourceId !== undefined ? { resourceId: d.resourceId as string } : {}),
        ...(d.ipAddress !== undefined ? { ipAddress: d.ipAddress as string } : {}),
        ...(d.userAgent !== undefined ? { userAgent: d.userAgent as string } : {}),
        ...(d.metadata !== undefined ? { metadata: d.metadata as Record<string, unknown> } : {}),
        ...(d.errorMessage !== undefined ? { errorMessage: d.errorMessage as string } : {}),
    };

    return auditLog;
}

/**
 * Map multiple audit log documents
 */
export function mapAuditLogDocuments(docs: unknown[]): IAuditLog[] {
    return docs.map(d => mapAuditLogDocument(d)).filter((d): d is IAuditLog => d !== null);
}
