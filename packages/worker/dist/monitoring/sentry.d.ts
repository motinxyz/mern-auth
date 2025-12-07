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
export declare const initSentry: ({ dsn, environment, tracesSampleRate, profilesSampleRate, }?: SentryOptions) => ISentry | null;
/**
 * Capture job error with context
 */
export declare const captureJobError: (error: Error, job: Job) => void;
export {};
//# sourceMappingURL=sentry.d.ts.map