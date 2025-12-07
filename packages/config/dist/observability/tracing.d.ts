/**
 * OpenTelemetry Tracing with Grafana Cloud Tempo Integration
 *
 * Features:
 * - Automatic instrumentation (Express, MongoDB, Redis, etc.)
 * - Distributed tracing
 * - Export to Grafana Cloud Tempo
 * - Graceful degradation
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
/**
 * Initialize OpenTelemetry tracing
 * MUST be called before any other imports
 */
export declare function initializeTracing(): NodeSDK | null;
/**
 * Shutdown tracing
 */
export declare function shutdownTracing(): Promise<void>;
/**
 * Get the OpenTelemetry SDK instance
 */
export declare function getTracingSDK(): NodeSDK | null;
//# sourceMappingURL=tracing.d.ts.map