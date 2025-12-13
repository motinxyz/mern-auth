import * as Sentry from "@sentry/react";
import { env } from "./env";

/**
 * Initialize Sentry with full observability features
 * - Error tracking
 * - Performance monitoring (Browser Tracing)
 * - Session Replay
 * - Trace propagation to backend
 */
export const initSentry = () => {
  if (!env.SENTRY_DSN) {
    console.warn("[Sentry] No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.isProduction ? "production" : "development",

    // Propagate traces to these origins (your API)
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.onrender\.com/,
      env.API_URL,
    ],

    integrations: [
      // Browser Tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Session Replay for debugging user sessions
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: env.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur

    // Release tracking
    release: env.APP_VERSION || "1.0.0",

    // Ignore common non-actionable errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Network request failed",
      "Load failed",
    ],

    // Add user context when available
    beforeSend(event) {
      // Redact sensitive data
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === "string" && data.includes("password")) {
          event.request.data = "[REDACTED]";
        }
      }
      return event;
    },
  });
};

/**
 * Get the current Sentry trace headers for API calls
 * This enables distributed tracing between frontend and backend
 */
export const getSentryTraceHeaders = () => {
  const span = Sentry.getActiveSpan();
  if (!span) return {};

  const traceData = Sentry.spanToTraceHeader(span);
  const baggageHeader = Sentry.spanToBaggageHeader(span);

  return {
    "sentry-trace": traceData,
    ...(baggageHeader && { baggage: baggageHeader }),
  };
};

export { Sentry };
