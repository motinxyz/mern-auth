/**
 * Worker Metrics
 *
 * OpenTelemetry metrics for queue worker processing.
 * Shipped to Grafana Cloud via OTLP.
 */

import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("auth-worker");

/**
 * Job processing duration histogram
 * Labels: queue, status (success/failed), job_type
 */
export const workerJobDuration = meter.createHistogram(
  "worker_job_duration_seconds",
  {
    description: "Job processing duration in seconds",
    unit: "s",
  }
);

/**
 * Total jobs processed counter
 * Labels: queue, status (success/failed), job_type
 */
export const workerJobTotal = meter.createCounter("worker_job_total", {
  description: "Total jobs processed by the worker",
});

/**
 * Currently active jobs gauge
 * Labels: queue
 */
export const workerActiveJobs = meter.createUpDownCounter(
  "worker_active_jobs",
  {
    description: "Number of currently active jobs being processed",
  }
);

/**
 * Jobs moved to dead letter queue
 * Labels: queue, job_type
 */
export const workerDlqTotal = meter.createCounter("worker_dlq_total", {
  description: "Total jobs moved to dead letter queue",
});

/**
 * Worker stalled jobs counter
 * Labels: queue
 */
export const workerStalledTotal = meter.createCounter("worker_stalled_total", {
  description: "Total stalled jobs detected",
});
