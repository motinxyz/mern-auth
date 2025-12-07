import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import type { Job } from "bullmq";
import type { ISentry } from "@auth/contracts";

/**
 * Sentry configuration options
 */
interface SentryOptions {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

/**
 * Initialize Sentry for the worker process
 * @returns Sentry instance wrapper or null if no DSN
 */
export const initSentry = ({
  dsn,
  environment = "development",
  tracesSampleRate,
  profilesSampleRate = 0.1,
}: SentryOptions = {}): ISentry | null => {
  if (dsn === undefined || dsn === "") {
    return null;
  }

  const defaultTracesSampleRate = environment === "production" ? 0.1 : 1.0;

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: tracesSampleRate ?? defaultTracesSampleRate,
    profilesSampleRate,
    integrations: [nodeProfilingIntegration()],
  });

  // Return a wrapper that matches ISentry interface
  return {
    captureException: (error: Error, context?: Record<string, unknown>) => {
      Sentry.captureException(error, { extra: context });
    },
    captureMessage: (message: string, options?: { level?: string; extra?: Record<string, unknown> }) => {
      Sentry.captureMessage(message, {
        level: (options?.level as Sentry.SeverityLevel) ?? "info",
        extra: options?.extra,
      });
    },
  };
};

/**
 * Capture job error with context
 */
export const captureJobError = (error: Error, job: Job): void => {
  const jobData = job.data as Record<string, unknown>;

  Sentry.captureException(error, {
    tags: {
      jobType: String(jobData?.type ?? "unknown"),
      queue: job.queueName,
      jobId: job.id ?? "unknown",
    },
    extra: {
      jobData: job.data,
      attemptsMade: job.attemptsMade,
      failedAt: new Date(),
    },
  });
};
