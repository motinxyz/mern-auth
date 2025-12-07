/**
 * Sentry Configuration - Gold Standard
 *
 * IMPORTANT: This MUST be imported FIRST before any other modules
 * Sentry needs to instrument Node.js before your application code runs
 *
 * NOTE: This module INTENTIONALLY uses process.env directly instead of @auth/config.
 * Importing config would trigger Redis/DB initialization which must happen AFTER Sentry.
 *
 * Features:
 * - Release tracking with version numbers
 * - Custom fingerprinting for intelligent error grouping
 * - User context enrichment
 * - Breadcrumbs for debugging
 * - Session tracking
 * - Performance monitoring
 */
import * as Sentry from "@sentry/node";
export declare const initSentry: () => typeof Sentry;
interface SentryUser {
    id?: string;
    _id?: {
        toString(): string;
    };
    email?: string;
    name?: string;
    role?: string;
}
export declare function setSentryUser(user: SentryUser | null | undefined): void;
export declare function addSentryBreadcrumb(category: string, message: string, data?: Record<string, unknown>, level?: Sentry.SeverityLevel): void;
/**
 * Start a Sentry transaction for performance monitoring
 */
export declare function startSentryTransaction(op: string, name: string, data?: Record<string, unknown>): {
    setHttpStatus: (status: number) => void;
    finish: () => void;
};
interface SentryContext {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
}
export declare const captureSentryException: (error: Error, context?: SentryContext) => void;
declare const SentryInstance: typeof Sentry | {
    setupExpressErrorHandler: () => void;
    captureException: () => void;
    captureMessage: () => void;
    setUser: () => void;
    addBreadcrumb: () => void;
    startTransaction: () => {
        finish: () => void;
    };
};
export { SentryInstance as Sentry };
//# sourceMappingURL=sentry.d.ts.map