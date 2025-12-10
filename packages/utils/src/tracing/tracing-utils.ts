/**
 * OpenTelemetry Tracing Utilities
 *
 * Production-grade helpers for consistent instrumentation across the application.
 * Follows OpenTelemetry semantic conventions and best practices.
 */

import {
  trace,
  SpanStatusCode,
  type Span,
  type AttributeValue,
  type SpanOptions,
} from "@opentelemetry/api";

// Import TraceContext from contracts (single source of truth)
import type { TraceContext } from "@auth/contracts";

// Re-export for convenience
export type { TraceContext };

/**
 * Options for withSpan function
 */
export interface WithSpanOptions extends SpanOptions {
  readonly tracerName?: string;
  readonly component?: string;
  readonly attributes?: Readonly<Record<string, AttributeValue>>;
}

/**
 * Execute a function within a new span
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options: WithSpanOptions = {}
): Promise<T> {
  const tracerName = options.tracerName ?? "auth-service";
  const tracer = trace.getTracer(tracerName);

  return tracer.startActiveSpan(name, options, async (span) => {
    try {
      // Add service component for differentiation in Tempo
      if (options.component != null) {
        span.setAttribute("service.component", options.component);
      }

      // Add initial attributes if provided
      if (options.attributes != null) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          if (value !== undefined) {
            span.setAttribute(key, value);
          }
        });
      }

      // Execute the function, passing the span for additional operations
      const result = await fn(span);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      // Record the error with full context
      recordError(span, error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add attributes to the current active span
 */
export function addSpanAttributes(
  attributes: Record<string, AttributeValue | undefined>
): void {
  const span = trace.getActiveSpan();
  if (!span) return;

  Object.entries(attributes).forEach(([key, value]) => {
    // Only add non-null, non-undefined values
    if (value !== null && value !== undefined) {
      span.setAttribute(key, value);
    }
  });
}

/**
 * Record an error on a span following OpenTelemetry conventions
 */
export function recordError(
  span: Span,
  error: Error & { statusCode?: number },
  additionalAttributes: Record<string, AttributeValue> = {}
): void {
  // Record the exception with stack trace
  span.recordException(error);

  // Set span status to ERROR
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });

  // Add error attributes following semantic conventions
  span.setAttribute("error.type", error.name || "Error");
  span.setAttribute("error.message", error.message);

  if (error.stack !== undefined) {
    span.setAttribute("error.stack", error.stack);
  }

  // Add HTTP status code if available (for API errors)
  if (error.statusCode != null) {
    span.setAttribute("http.status_code", error.statusCode);
  }

  // Add any additional context
  Object.entries(additionalAttributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });
}


/**
 * Get trace context for propagation (e.g., to queue jobs)
 */
export function getTraceContext(): TraceContext | null {
  const span = trace.getActiveSpan();
  if (!span) return null;

  const spanContext = span.spanContext();

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
  };
}

/**
 * Set remote trace context (e.g., from queue job metadata)
 * Creates a span link to connect distributed traces
 */
export function createSpanLink(
  traceContext: TraceContext | null | undefined
): { context: TraceContext } | null {
  if (!traceContext || !traceContext.traceId) return null;

  return {
    context: {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      traceFlags: traceContext.traceFlags,
    },
  };
}

/**
 * Add an event to the current span
 */
export function addSpanEvent(
  name: string,
  attributes: Record<string, AttributeValue> = {}
): void {
  const span = trace.getActiveSpan();
  if (!span) return;

  span.addEvent(name, attributes);
}
