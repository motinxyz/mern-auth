/**
 * OpenTelemetry Tracing Utilities
 *
 * Production-grade helpers for consistent instrumentation across the application.
 * Follows OpenTelemetry semantic conventions and best practices.
 */

import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import crypto from "crypto";

/**
 * Execute a function within a new span
 *
 * @param {string} name - Span name (use kebab-case, e.g., 'create-user')
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Span options
 * @param {Object} options.attributes - Span attributes
 * @param {string} options.kind - Span kind (INTERNAL, CLIENT, SERVER, PRODUCER, CONSUMER)
 * @param {string} options.tracerName - Tracer name (e.g., 'auth-api', 'auth-worker', 'email-service')
 * @param {string} options.component - Service component ('api', 'worker', 'email') for service differentiation
 * @returns {Promise<*>} Result of the function
 *
 * @example
 * const user = await withSpan('create-user', async (span) => {
 *   span.setAttribute('user.email', hashSensitiveData(email));
 *   return await User.create(userData);
 * }, { attributes: { 'db.operation': 'insert' }, tracerName: 'auth-api' });
 */
export async function withSpan(name, fn, options = {}) {
  const tracerName = options.tracerName || "auth-service";
  const tracer = trace.getTracer(tracerName);

  return tracer.startActiveSpan(name, options, async (span) => {
    try {
      // Add service component for differentiation in Tempo
      if (options.component) {
        span.setAttribute("service.component", options.component);
      }

      // Add initial attributes if provided
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      // Execute the function, passing the span for additional operations
      const result = await fn(span);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      // Record the error with full context
      recordError(span, error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add attributes to the current active span
 *
 * @param {Object} attributes - Key-value pairs to add as span attributes
 *
 * @example
 * addSpanAttributes({
 *   'user.id': userId,
 *   'db.operation': 'update',
 *   'db.mongodb.collection': 'users'
 * });
 */
export function addSpanAttributes(attributes) {
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
 *
 * @param {Span} span - The span to record the error on
 * @param {Error} error - The error to record
 * @param {Object} additionalAttributes - Additional context attributes
 *
 * @example
 * recordError(span, error, {
 *   'error.context': 'database_transaction',
 *   'user.id': userId
 * });
 */
export function recordError(span, error, additionalAttributes = {}) {
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

  if (error.stack) {
    span.setAttribute("error.stack", error.stack);
  }

  // Add HTTP status code if available (for API errors)
  if (error.statusCode) {
    span.setAttribute("http.status_code", error.statusCode);
  }

  // Add any additional context
  Object.entries(additionalAttributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });
}

/**
 * Hash sensitive data for safe inclusion in span attributes
 * Uses SHA-256 to create a consistent, non-reversible hash
 *
 * @param {string} value - Sensitive value to hash (e.g., email, phone)
 * @returns {string} Hashed value (first 16 chars of SHA-256 hash)
 *
 * @example
 * span.setAttribute('user.email_hash', hashSensitiveData(user.email));
 */
export function hashSensitiveData(value) {
  if (!value) return "";

  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex")
    .substring(0, 16);
}

/**
 * Get trace context for propagation (e.g., to queue jobs)
 *
 * @returns {Object} Trace context with traceId, spanId, and traceFlags
 *
 * @example
 * const traceContext = getTraceContext();
 * await queue.add('job', { data, traceContext });
 */
export function getTraceContext() {
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
 *
 * @param {Object} traceContext - Trace context from getTraceContext()
 * @returns {Object} Span link object for use in span options
 *
 * @example
 * const link = createSpanLink(job.data.traceContext);
 * await withSpan('process-job', async (span) => {
 *   // Process job
 * }, { links: [link] });
 */
export function createSpanLink(traceContext) {
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
 * Events are timestamped annotations within a span
 *
 * @param {string} name - Event name
 * @param {Object} attributes - Event attributes
 *
 * @example
 * addSpanEvent('user.email_sent', {
 *   'email.provider': 'resend',
 *   'email.type': 'verification'
 * });
 */
export function addSpanEvent(name, attributes = {}) {
  const span = trace.getActiveSpan();
  if (!span) return;

  span.addEvent(name, attributes);
}
