/**
 * Logger with Grafana Agent Integration
 *
 * Features:
 * - Structured logging with Pino
 * - Clean JSON output for Grafana Agent collection
 * - Pretty printing in development
 * - File rotation support for production
 * - Trace ID correlation
 */
import { type Logger, type LoggerOptions } from "pino";
/**
 * Create logger optimized for Grafana Agent collection
 *
 * In development: Pretty-printed console output
 * In production: pino-loki transport to ship logs directly to Grafana Cloud
 */
export declare function getObservabilityLogger(options?: Partial<LoggerOptions>): Logger;
/**
 * Get logger with trace context
 * Automatically includes trace ID if available
 */
export declare function getLoggerWithTrace(traceId: string | undefined, options?: Partial<LoggerOptions>): Logger;
//# sourceMappingURL=logger.d.ts.map