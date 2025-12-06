import * as Sentry from "@sentry/node";
/**
 * Initialize Sentry for the worker process
 * @param {Object} options - Sentry configuration
 * @param {string} options.dsn - Sentry DSN
 * @param {string} options.environment - Environment name
 * @param {number} [options.tracesSampleRate] - Traces sample rate (default: 0.1 for prod, 1.0 otherwise)
 * @param {number} [options.profilesSampleRate] - Profiles sample rate (default: 0.1)
 * @returns {Object|null} - Sentry instance or null if no DSN
 */
export declare const initSentry: ({ dsn, environment, tracesSampleRate, profilesSampleRate, }?: any) => typeof Sentry;
/**
 * Capture job error with context
 * @param {Error} error - The error to capture
 * @param {Object} job - The BullMQ job
 */
export declare const captureJobError: (error: any, job: any) => void;
//# sourceMappingURL=sentry.d.ts.map