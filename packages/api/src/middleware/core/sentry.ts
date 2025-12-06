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
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import crypto from "crypto";

// Read from process.env directly - DO NOT import @auth/config here
// Sentry must be initialized before any other modules load
const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const IS_DEVELOPMENT = NODE_ENV === "development";
const SENTRY_DEV_ENABLED = process.env.SENTRY_DEV_ENABLED === "true";

/**
 * Hash sensitive data (PII) for Sentry
 */
function hashPII(value) {
  if (!value) return "";
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex")
    .substring(0, 16);
}

// Only initialize Sentry if DSN is provided (not in tests)
export const initSentry = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,

      // Release tracking - critical for debugging
      release: `auth-api@${process.env.npm_package_version || "1.0.0"}`, // NPM version is standard env

      // Performance Monitoring
      tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

      // Session tracking for user impact analysis
      autoSessionTracking: true,

      // Profiling
      profilesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
      integrations: [nodeProfilingIntegration()],

      // Filter out noise
      ignoreErrors: [
        "Network request failed",
        "timeout of 0ms exceeded",
        "ECONNREFUSED",
        "ETIMEDOUT",
      ],

      // Custom fingerprinting for intelligent error grouping
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (IS_DEVELOPMENT && !SENTRY_DEV_ENABLED) {
          return null;
        }

        // Custom fingerprinting for better error grouping
        const error = hint.originalException;

        if (error) {
          // Group validation errors by field
          if ((error as any).name === "ValidationError" && (error as any).errors) {
            const fields = Object.keys((error as any).errors).sort().join(",");
            event.fingerprint = ["validation-error", fields];
          }

          // Group database errors by code
          if ((error as any).code === 11000) {
            const field = Object.keys((error as any).keyPattern || {})[0];
            event.fingerprint = ["duplicate-key", field || "unknown"];
          }

          // Group API errors by status code and endpoint
          if ((error as any).statusCode && event.request?.url) {
            const endpoint = event.request.url.split("?")[0];
            event.fingerprint = [
              "api-error",
              String((error as any).statusCode),
              endpoint,
            ];
          }
        }

        return event;
      },
    } as any);
  }
  return Sentry;
};

/**
 * Set user context for error tracking
 * Call this after user authentication
 */
export function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id || user._id?.toString(),
    email: hashPII(user.email), // Hash email for privacy
    username: user.name,
    role: user.role,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  category,
  message,
  data = {},
  level = "info"
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level: level as Sentry.SeverityLevel,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a Sentry transaction for performance monitoring
 */
export function startSentryTransaction(op, name, data = {}) {
  return (Sentry as any).startTransaction({
    op,
    name,
    data,
  });
}

/**
 * Capture exception with context
 */
/* eslint-disable import/no-unused-modules */
export const captureSentryException = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: (context as any).tags || {},
    extra: (context as any).extra || {},
    level: (context as any).level || "error",
  });
};

// Export Sentry with mock handlers for test environment
const SentryInstance = SENTRY_DSN
  ? Sentry
  : {
    setupExpressErrorHandler: () => { },
    captureException: () => { },
    captureMessage: () => { },
    setUser: () => { },
    addBreadcrumb: () => { },
    startTransaction: () => ({ finish: () => { } }),
  };

export { SentryInstance as Sentry };
