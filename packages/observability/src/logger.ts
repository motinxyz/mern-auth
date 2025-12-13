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

let sharedLogger: Logger | undefined;

/**
 * Get logger with explicit trace ID
 *
 * Uses a shared singleton to avoid creating new Pino instances (expensive).
 * Returns a lightweight child logger (cheap) with the traceId bound.
 */
export function getLoggerWithTrace(traceId: string | undefined, options: CreateLoggerOptions = {}): Logger {
    // 1. Initialize shared singleton once
    if (sharedLogger === undefined) {
        sharedLogger = createObservabilityLogger(options);
    }

    // 2. Return lightweight child logger
    if (traceId !== undefined && traceId !== "") {
        return sharedLogger.child({ traceId });
    }

    return sharedLogger;
}

// Re-export for convenience
export { type Logger, type CreateLoggerOptions } from "@auth/logger";
