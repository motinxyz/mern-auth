export const _RETRY_STRATEGIES = {
    EXPONENTIAL: {
        type: "exponential",
        delay: 1000,
        attempts: 3,
    },
    LINEAR: {
        type: "linear",
        delay: 5000,
        attempts: 3,
    },
    CRITICAL: {
        type: "exponential",
        delay: 2000,
        attempts: 5, // More retries for critical jobs
    },
    FAST_FAIL: {
        type: "fixed",
        delay: 1000,
        attempts: 1, // Fail fast for non-critical
    },
};
//# sourceMappingURL=retry-strategies.js.map