/**
 * Logger with OpenTelemetry Trace Context
 *
 * Wraps @auth/logger to add trace/span context for correlation.
 */

import { createLogger, type Logger, type CreateLoggerOptions } from "@auth/logger";
import { trace } from "@opentelemetry/api";

/**
 * Create a logger with automatic trace context injection
 *
 * Logs automatically include traceId, spanId when available.
 *
 * @param options - Optional configuration
 * @returns Configured Pino logger with trace context
 */
export function createObservabilityLogger(options: CreateLoggerOptions = {}): Logger {
    return createLogger({
        ...options,
        mixin() {
            const span = trace.getActiveSpan();
            const spanContext = span?.spanContext();

            if (spanContext !== undefined) {
                return {
                    traceId: spanContext.traceId,
                    spanId: spanContext.spanId,
                    traceFlags: spanContext.traceFlags,
                };
            }
            return {};
        },
    });
}

/**
 * Get logger with trace context (backward compatibility)
 * @deprecated Use createObservabilityLogger()
 */
export function getObservabilityLogger(options: CreateLoggerOptions = {}): Logger {
    return createObservabilityLogger(options);
}

/**
 * Get logger with explicit trace ID
 */
export function getLoggerWithTrace(traceId: string | undefined, options: CreateLoggerOptions = {}): Logger {
    const logger = createObservabilityLogger(options);

    if (traceId !== undefined && traceId !== "") {
        return logger.child({ traceId });
    }

    return logger;
}

// Re-export for convenience
export { type Logger, type CreateLoggerOptions } from "@auth/logger";

