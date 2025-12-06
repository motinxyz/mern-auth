/**
 * Sentry Middleware - Gold Standard
 *
 * Automatically enriches errors with:
 * - User context
 * - Request breadcrumbs
 * - Performance transactions
 */
import { setSentryUser, addSentryBreadcrumb, startSentryTransaction, } from "./core/sentry.js";
/**
 * Middleware to set Sentry user context for authenticated requests
 */
export const sentryUserMiddleware = (req, res, next) => {
    // Set user context if authenticated
    if (req.user) {
        setSentryUser(req.user);
    }
    // Add breadcrumb for this request
    addSentryBreadcrumb("http.request", `${req.method} ${req.path}`, {
        method: req.method,
        url: req.url,
        query: req.query,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    }, "info");
    next();
};
/**
 * Middleware to track performance of critical operations
 */
/* eslint-disable import/no-unused-modules */
export const sentryPerformanceMiddleware = (req, res, next) => {
    // Only track important endpoints
    const shouldTrack = req.path.includes("/auth/") || req.path.includes("/api/v1/");
    if (!shouldTrack) {
        return next();
    }
    const transaction = startSentryTransaction("http.server", `${req.method} ${req.route?.path || req.path}`, {
        method: req.method,
        url: req.url,
    });
    // Finish transaction when response is sent
    res.on("finish", () => {
        transaction.setHttpStatus(res.statusCode);
        transaction.finish();
    });
    next();
};
/**
 * Add breadcrumb for authentication events
 */
/* eslint-disable import/no-unused-modules */
export function addAuthBreadcrumb(event, data = {}) {
    addSentryBreadcrumb("auth", event, data, "info");
}
/**
 * Add breadcrumb for email events
 */
/* eslint-disable import/no-unused-modules */
export function addEmailBreadcrumb(event, data = {}) {
    addSentryBreadcrumb("email", event, data, "info");
}
/**
 * Add breadcrumb for database events
 */
/* eslint-disable import/no-unused-modules */
export function addDatabaseBreadcrumb(event, data = {}) {
    addSentryBreadcrumb("database", event, data, "info");
}
//# sourceMappingURL=sentry.middleware.js.map