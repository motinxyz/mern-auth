/**
 * Sentry Middleware - Gold Standard
 *
 * Automatically enriches errors with:
 * - User context
 * - Request breadcrumbs
 * - Performance transactions
 */
/**
 * Middleware to set Sentry user context for authenticated requests
 */
export declare const sentryUserMiddleware: (req: any, res: any, next: any) => void;
/**
 * Middleware to track performance of critical operations
 */
export declare const sentryPerformanceMiddleware: (req: any, res: any, next: any) => any;
/**
 * Add breadcrumb for authentication events
 */
export declare function addAuthBreadcrumb(event: any, data?: {}): void;
/**
 * Add breadcrumb for email events
 */
export declare function addEmailBreadcrumb(event: any, data?: {}): void;
/**
 * Add breadcrumb for database events
 */
export declare function addDatabaseBreadcrumb(event: any, data?: {}): void;
//# sourceMappingURL=sentry.middleware.d.ts.map