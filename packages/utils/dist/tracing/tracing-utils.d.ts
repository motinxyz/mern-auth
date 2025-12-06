/**
 * OpenTelemetry Tracing Utilities
 *
 * Production-grade helpers for consistent instrumentation across the application.
 * Follows OpenTelemetry semantic conventions and best practices.
 */
import { type Span, type AttributeValue, type SpanOptions } from "@opentelemetry/api";
/**
 * Options for withSpan function
 */
export interface WithSpanOptions extends SpanOptions {
    tracerName?: string;
    component?: string;
    attributes?: Record<string, AttributeValue>;
}
/**
 * Trace context for propagation
 */
export interface TraceContext {
    traceId: string;
    spanId: string;
    traceFlags: number;
}
/**
 * Execute a function within a new span
 */
export declare function withSpan<T>(name: string, fn: (span: Span) => Promise<T>, options?: WithSpanOptions): Promise<T>;
/**
 * Add attributes to the current active span
 */
export declare function addSpanAttributes(attributes: Record<string, AttributeValue | undefined>): void;
/**
 * Record an error on a span following OpenTelemetry conventions
 */
export declare function recordError(span: Span, error: Error & {
    statusCode?: number;
}, additionalAttributes?: Record<string, AttributeValue>): void;
/**
 * Hash sensitive data for safe inclusion in span attributes
 */
export declare function hashSensitiveData(value: string | undefined | null): string;
/**
 * Get trace context for propagation (e.g., to queue jobs)
 */
export declare function getTraceContext(): TraceContext | null;
/**
 * Set remote trace context (e.g., from queue job metadata)
 * Creates a span link to connect distributed traces
 */
export declare function createSpanLink(traceContext: TraceContext | null | undefined): {
    context: TraceContext;
} | null;
/**
 * Add an event to the current span
 */
export declare function addSpanEvent(name: string, attributes?: Record<string, AttributeValue>): void;
//# sourceMappingURL=tracing-utils.d.ts.map