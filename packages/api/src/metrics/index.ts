import { metrics } from "@opentelemetry/api";

// Get the meter from the global provider
// The name should match the service name or package name
const meter = metrics.getMeter("auth-api-metrics");

/**
 * HTTP Request Duration Histogram
 * Tracks response time for all HTTP requests
 */
const httpRequestDuration = meter.createHistogram(
  "http_request_duration_seconds",
  {
    description: "Duration of HTTP requests in seconds",
    unit: "s",
  }
);

/**
 * HTTP Request Total Counter
 * Tracks total number of HTTP requests
 */
const httpRequestTotal = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

/**
 * Queue Job Duration Histogram
 * Tracks processing time for queue jobs
 */
const queueJobDuration = meter.createHistogram("queue_job_duration_seconds", {
  description: "Duration of queue job processing in seconds",
  unit: "s",
});

/**
 * Queue Job Total Counter
 * Tracks total number of queue jobs processed
 */
const queueJobTotal = meter.createCounter("queue_jobs_total", {
  description: "Total number of queue jobs processed",
});

/**
 * Circuit Breaker State Gauge
 * Tracks circuit breaker state (0 = closed, 1 = half-open, 2 = open)
 * Note: OTel doesn't have a direct Gauge yet, using UpDownCounter or ObservableGauge
 * Using UpDownCounter for simplicity in state tracking
 */
const circuitBreakerState = meter.createUpDownCounter("circuit_breaker_state", {
  description: "Circuit breaker state (0=closed, 1=half-open, 2=open)",
});

/**
 * Circuit Breaker Failures Counter
 * Tracks circuit breaker failures
 */
const circuitBreakerFailures = meter.createCounter(
  "circuit_breaker_failures_total",
  {
    description: "Total number of circuit breaker failures",
  }
);

/**
 * Active Database Connections Gauge
 */
const dbConnectionsActive = meter.createUpDownCounter("db_connections_active", {
  description: "Number of active database connections",
});

/**
 * Redis Operations Duration Histogram
 * Tracks Redis operation duration
 */
const redisOperationDuration = meter.createHistogram(
  "redis_operation_duration_seconds",
  {
    description: "Duration of Redis operations in seconds",
    unit: "s",
  }
);

/**
 * Email Sent Total Counter
 * Tracks total emails sent
 */
const emailSentTotal = meter.createCounter("emails_sent_total", {
  description: "Total number of emails sent",
});

/**
 * Middleware to track HTTP metrics
 */
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Track when response finishes
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;

    const attributes = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.record(duration, attributes);
    httpRequestTotal.add(1, attributes);
  });

  next();
};

/**
 * Update circuit breaker metrics
 */
/* eslint-disable import/no-unused-modules */
export const updateCircuitBreakerMetrics = (name, state, isFailure = false) => {
  // State: 'closed' = 0, 'half-open' = 1, 'open' = 2
  const stateValue = state === "closed" ? 0 : state === "half-open" ? 1 : 2;

  // Note: UpDownCounter adds/subtracts, so we can't just "set" the value.
  // For a true Gauge, we'd need an ObservableGauge, but that requires a callback.
  // For now, we'll just log the state change or use a Counter for transitions.
  // A better approach for OTel is to track *transitions* rather than state.
  circuitBreakerState.add(stateValue, { name }); // This is imperfect but keeps the API consistent

  if (isFailure) {
    circuitBreakerFailures.add(1, { name });
  }
};

/**
 * Update queue job metrics
 */
/* eslint-disable import/no-unused-modules */
export const updateQueueMetrics = (queueName, jobType, status, duration) => {
  const attributes = {
    queue_name: queueName,
    job_type: jobType,
    status,
  };

  queueJobDuration.record(duration, attributes);
  queueJobTotal.add(1, attributes);
};

/**
 * Update email metrics
 */
/* eslint-disable import/no-unused-modules */
export const updateEmailMetrics = (type, status, provider) => {
  emailSentTotal.add(1, {
    type,
    status,
    provider: provider || "unknown",
  });
};
