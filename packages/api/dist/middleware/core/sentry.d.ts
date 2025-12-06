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
/**
 * Set user context for error tracking
 * Call this after user authentication
 */
export declare function setSentryUser(user: any): void;
/**
 * Add breadcrumb for debugging
 */
export declare function addSentryBreadcrumb(category: any, message: any, data?: {}, level?: string): void;
/**
 * Start a Sentry transaction for performance monitoring
 */
export declare function startSentryTransaction(op: any, name: any, data?: {}): any;
/**
 * Capture exception with context
 */
export declare const captureSentryException: (error: any, context?: {}) => void;
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