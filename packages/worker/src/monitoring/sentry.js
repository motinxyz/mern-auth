import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

/**
 * Initialize Sentry for the worker process
 * @param {Object} options - Sentry configuration
 * @param {string} options.dsn - Sentry DSN
 * @param {string} options.environment - Environment name
 * @param {number} [options.tracesSampleRate] - Traces sample rate (default: 0.1 for prod, 1.0 otherwise)
 * @param {number} [options.profilesSampleRate] - Profiles sample rate (default: 0.1)
 * @returns {Object|null} - Sentry instance or null if no DSN
 */
export const initSentry = (options = {}) => {
  const {
    dsn,
    environment = "development",
    tracesSampleRate,
    profilesSampleRate = 0.1,
  } = options;

  if (!dsn) {
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

  return Sentry;
};

/**
 * Capture job error with context
 * @param {Error} error - The error to capture
 * @param {Object} job - The BullMQ job
 */
export const captureJobError = (error, job) => {
  Sentry.captureException(error, {
    tags: {
      jobType: job.data?.type,
      queue: job.queueName,
      jobId: job.id,
    },
    extra: {
      jobData: job.data,
      attemptsMade: job.attemptsMade,
      failedAt: new Date(),
    },
  });
};
