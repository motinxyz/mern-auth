import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
/**
 * Initialize Sentry for the worker process
 * @returns Sentry instance wrapper or null if no DSN
 */
export const initSentry = ({ dsn, environment = "development", tracesSampleRate, profilesSampleRate = 0.1, } = {}) => {
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
        captureException: (error, context) => {
            Sentry.captureException(error, { extra: context });
        },
        captureMessage: (message, options) => {
            Sentry.captureMessage(message, {
                level: options?.level ?? "info",
                extra: options?.extra,
            });
        },
    };
};
/**
 * Capture job error with context
 */
export const captureJobError = (error, job) => {
    const jobData = job.data;
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
//# sourceMappingURL=sentry.js.map