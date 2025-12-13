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
const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PRODUCTION = NODE_ENV === "production";
const IS_DEVELOPMENT = NODE_ENV === "development";
const SENTRY_DEV_ENABLED = process.env.SENTRY_DEV_ENABLED === "true";

/**
 * Hash sensitive data (PII) for Sentry
 */
function hashPII(value: string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex")
    .substring(0, 16);
}

// Only initialize Sentry if DSN is provided (not in tests)
export const initSentry = () => {
  if (SENTRY_DSN !== undefined && SENTRY_DSN !== "") {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,

      // Release tracking - critical for debugging
      release: `auth-api@${process.env.npm_package_version ?? "1.0.0"}`, // NPM version is standard env

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
      beforeSend(event: Sentry.Event, hint: Sentry.EventHint) {
        // Don't send events in development unless explicitly enabled
        if (IS_DEVELOPMENT && !SENTRY_DEV_ENABLED) {
          return null;
        }

        // Custom fingerprinting for better error grouping
        const error = hint.originalException as Error & {
          name?: string;
          errors?: Record<string, unknown>;
          code?: number;
          keyPattern?: Record<string, unknown>;
          statusCode?: number;
        };

        if (error !== null && error !== undefined) {
          // Group validation errors by field
          if (error.name === "ValidationError" && error.errors !== undefined) {
            const fields = Object.keys(error.errors).sort().join(",");
            event.fingerprint = ["validation-error", fields];
          }

          // Group database errors by code
          if (error.code === 11000) {
            const keyPattern = error.keyPattern ?? {};
            const field = Object.keys(keyPattern)[0];
            event.fingerprint = ["duplicate-key", field ?? "unknown"];
          }

          // Group API errors by status code and endpoint
          if (error.statusCode !== undefined && event.request?.url !== undefined) {
            const endpoint = event.request.url.split("?")[0];
            event.fingerprint = [
              "api-error",
              String(error.statusCode),
              endpoint ?? "unknown",
            ];
          }
        }

        return event;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sentry options are complex
    } as any);
  }
  return Sentry;
};

interface SentryUser {
  id?: string;
  _id?: { toString(): string };
  email?: string;
  name?: string;
  role?: string;
}

export function setSentryUser(user: SentryUser | null | undefined): void {
  if (user === null || user === undefined) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id ?? user._id?.toString(),
    email: hashPII(user.email),
    username: user.name,
  });
}

export function addSentryBreadcrumb(
  category: string,
  message: string,
  data: Record<string, unknown> = {},
  level: Sentry.SeverityLevel = "info"
): void {
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
export function startSentryTransaction(
  op: string,
  name: string,
  data: Record<string, unknown> = {}
): { setHttpStatus: (status: number) => void; finish: () => void } {
  // @ts-expect-error - Sentry transaction API not fully typed
  return Sentry.startTransaction({
    op,
    name,
    data,
  });
}

interface SentryContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: Sentry.SeverityLevel;
}

export const captureSentryException = (error: Error, context: SentryContext = {}): void => {
  Sentry.captureException(error, {
    tags: context.tags ?? {},
    extra: context.extra ?? {},
    level: context.level ?? "error",
  });
};

// Export Sentry with mock handlers for test environment
const SentryInstance = (SENTRY_DSN !== undefined && SENTRY_DSN !== "")
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
