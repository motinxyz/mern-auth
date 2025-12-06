/**
 * Application-wide queue names
 * Centralized to prevent typos and ensure consistency
 */
export declare const QUEUE_NAMES: Readonly<{
    EMAIL: "emailQueue";
    EMAIL_DEAD_LETTER: "emailDeadLetter";
}>;
/**
 * Email job types
 */
export declare const EMAIL_JOB_TYPES: Readonly<{
    SEND_VERIFICATION_EMAIL: "sendVerificationEmail";
}>;
/**
 * Default settings for queue workers
 */
export declare const WORKER_CONFIG: Readonly<{
    concurrency: 5;
    limiter: {
        max: number;
        duration: number;
    };
    settings: {
        stalledInterval: number;
        maxStalledCount: number;
        lockDuration: number;
        drainDelay: number;
    };
    retention: {
        removeOnComplete: {
            count: number;
        };
        removeOnFail: {
            count: number;
        };
    };
}>;
//# sourceMappingURL=queue.d.ts.map