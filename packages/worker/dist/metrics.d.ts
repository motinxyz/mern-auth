/**
 * Worker Metrics
 *
 * OpenTelemetry metrics for queue worker processing.
 * Shipped to Grafana Cloud via OTLP.
 */
/**
 * Job processing duration histogram
 * Labels: queue, status (success/failed), job_type
 */
export declare const workerJobDuration: import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
/**
 * Total jobs processed counter
 * Labels: queue, status (success/failed), job_type
 */
export declare const workerJobTotal: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Currently active jobs gauge
 * Labels: queue
 */
export declare const workerActiveJobs: import("@opentelemetry/api").UpDownCounter<import("@opentelemetry/api").Attributes>;
/**
 * Jobs moved to dead letter queue
 * Labels: queue, job_type
 */
export declare const workerDlqTotal: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Worker stalled jobs counter
 * Labels: queue
 */
export declare const workerStalledTotal: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
//# sourceMappingURL=metrics.d.ts.map