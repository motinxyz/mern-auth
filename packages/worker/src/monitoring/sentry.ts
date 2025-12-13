import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import type { Job } from "bullmq";
import type { ISentry } from "@auth/contracts";

/**
 * Initialize Sentry for the worker process
 * @returns Sentry instance wrapper or null if no DSN
 */
export const initSentry = (options?: {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}): ISentry | null => {
  const dsn = options?.dsn;
  if (dsn === undefined || dsn === "") {
    return null;
  }

  const environment = options?.environment ?? "development";
  const profilesSampleRate = options?.profilesSampleRate ?? 0.1;
  const defaultTracesSampleRate = environment === "production" ? 0.1 : 1.0;

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: options?.tracesSampleRate ?? defaultTracesSampleRate,
    profilesSampleRate,
    integrations: [nodeProfilingIntegration()],
  });

  // Return a wrapper that matches ISentry interface
  return {
    captureException: (error: Error, context?: Record<string, unknown>) => {
      if (context !== undefined) {
        Sentry.captureException(error, { extra: context });
      } else {
        Sentry.captureException(error);
      }
    },
    captureMessage: (message: string, options?: { level?: string; extra?: Record<string, unknown> }) => {
      const captureOptions: { level: Sentry.SeverityLevel; extra?: Record<string, unknown> } = {
        level: (options?.level as Sentry.SeverityLevel) ?? "info",
      };
      if (options?.extra !== undefined) {
        captureOptions.extra = options.extra;
      }
      Sentry.captureMessage(message, captureOptions);
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
