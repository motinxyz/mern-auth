import type { Request, Response, NextFunction } from "express";
/**
 * Middleware to track HTTP metrics
 */
export declare const metricsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Update circuit breaker metrics
 */
export declare const updateCircuitBreakerMetrics: (name: string, state: string, isFailure?: boolean) => void;
/**
 * Update queue job metrics
 */
export declare const updateQueueMetrics: (queueName: string, jobType: string, status: string, duration: number) => void;
/**
 * Update email metrics
 */
export declare const updateEmailMetrics: (type: string, status: string, provider?: string) => void;
//# sourceMappingURL=index.d.ts.map