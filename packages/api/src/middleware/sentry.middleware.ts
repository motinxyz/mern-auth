/**
 * Sentry Middleware - Gold Standard
 *
 * Automatically enriches errors with:
 * - User context
 * - Request breadcrumbs
 * - Performance transactions
 */

import {
  setSentryUser,
  addSentryBreadcrumb,
  startSentryTransaction,
} from "./core/sentry.js";
import type { Request, Response, NextFunction } from "express";
// import type { TokenUser } from "@auth/contracts"; // Unused

/**
 * Middleware to set Sentry user context for authenticated requests
 */
export const sentryUserMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Set user context if authenticated
  if (req.user !== undefined) {
    setSentryUser(req.user);
  }

  // Add breadcrumb for this request
  addSentryBreadcrumb(
    "http.request",
    `${req.method} ${req.path}`,
    {
      method: req.method,
      url: req.url,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
    "info"
  );

  next();
};

/**
 * Middleware to track performance of critical operations
 */
export const sentryPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only track important endpoints
  const shouldTrack =
    req.path.includes("/auth/") || req.path.includes("/api/v1/");

  if (!shouldTrack) {
    return next();
  }

  const transaction = startSentryTransaction(
    "http.server",
    `${req.method} ${req.route?.path !== undefined ? req.route.path : req.path}`,
    {
      method: req.method,
      url: req.url,
    }
  );

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
export function addAuthBreadcrumb(event: string, data: Record<string, unknown> = {}) {
  addSentryBreadcrumb("auth", event, data, "info");
}

/**
 * Add breadcrumb for email events
 */
export function addEmailBreadcrumb(event: string, data: Record<string, unknown> = {}) {
  addSentryBreadcrumb("email", event, data, "info");
}

/**
 * Add breadcrumb for database events
 */
export function addDatabaseBreadcrumb(event: string, data: Record<string, unknown> = {}) {
  addSentryBreadcrumb("database", event, data, "info");
}
