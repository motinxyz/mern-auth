/**
 * Middleware to track HTTP metrics
 */
export declare const metricsMiddleware: (req: any, res: any, next: any) => void;
/**
 * Update circuit breaker metrics
 */
export declare const updateCircuitBreakerMetrics: (name: any, state: any, isFailure?: boolean) => void;
/**
 * Update queue job metrics
 */
export declare const updateQueueMetrics: (queueName: any, jobType: any, status: any, duration: any) => void;
/**
 * Update email metrics
 */
export declare const updateEmailMetrics: (type: any, status: any, provider: any) => void;
//# sourceMappingURL=index.d.ts.map