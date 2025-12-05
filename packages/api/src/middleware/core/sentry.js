/**
 * Sentry Configuration - Gold Standard
 *
 * IMPORTANT: This MUST be imported FIRST before any other modules
 * Sentry needs to instrument Node.js before your application code runs
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
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",

      // Release tracking - critical for debugging
      release: `auth-api@${process.env.npm_package_version || "1.0.0"}`,

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

      // Session tracking for user impact analysis
      autoSessionTracking: true,

      // Profiling
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
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
        if (
          process.env.NODE_ENV === "development" &&
          !process.env.SENTRY_DEV_ENABLED
        ) {
          return null;
        }

        // Custom fingerprinting for better error grouping
        const error = hint.originalException;

        if (error) {
          // Group validation errors by field
          if (error.name === "ValidationError" && error.errors) {
            const fields = Object.keys(error.errors).sort().join(",");
            event.fingerprint = ["validation-error", fields];
          }

          // Group database errors by code
          if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            event.fingerprint = ["duplicate-key", field || "unknown"];
          }

          // Group API errors by status code and endpoint
          if (error.statusCode && event.request?.url) {
            const endpoint = event.request.url.split("?")[0];
            event.fingerprint = [
              "api-error",
              String(error.statusCode),
              endpoint,
            ];
          }
        }

        return event;
      },
    });
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
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a Sentry transaction for performance monitoring
 */
export function startSentryTransaction(op, name, data = {}) {
  return Sentry.startTransaction({
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
    tags: context.tags || {},
    extra: context.extra || {},
    level: context.level || "error",
  });
};

// Export Sentry with mock handlers for test environment
const SentryInstance = process.env.SENTRY_DSN
  ? Sentry
  : {
      setupExpressErrorHandler: () => {},
      captureException: () => {},
      captureMessage: () => {},
      setUser: () => {},
      addBreadcrumb: () => {},
      startTransaction: () => ({ finish: () => {} }),
    };

export { SentryInstance as Sentry };
