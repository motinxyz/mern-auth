/**
 * Sentry Middleware - Gold Standard
 *
 * Automatically enriches errors with:
 * - User context
 * - Request breadcrumbs
 * - Performance transactions
 */
import type { Request, Response, NextFunction } from "express";
import type { TokenUser } from "@auth/contracts";
interface AuthenticatedRequest extends Request {
    user?: TokenUser;
}
/**
 * Middleware to set Sentry user context for authenticated requests
 */
export declare const sentryUserMiddleware: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
/**
 * Middleware to track performance of critical operations
 */
export declare const sentryPerformanceMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Add breadcrumb for authentication events
 */
export declare function addAuthBreadcrumb(event: string, data?: Record<string, unknown>): void;
/**
 * Add breadcrumb for email events
 */
export declare function addEmailBreadcrumb(event: string, data?: Record<string, unknown>): void;
/**
 * Add breadcrumb for database events
 */
export declare function addDatabaseBreadcrumb(event: string, data?: Record<string, unknown>): void;
export {};
//# sourceMappingURL=sentry.middleware.d.ts.map