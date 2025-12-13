/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { BatchSpanProcessor, type SpanProcessor, type ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { createModuleLogger } from "../startup-logger.js";
import { observabilityConfig, isTracingEnabled } from "../config.js";
import { FilteringSpanProcessor } from "./processor.js";
import {
    ignoreIncomingRequestHook,
    requestHook,
    startOutgoingSpanHook,
    applyCustomAttributesOnSpan,
    expressSpanNameHook,
    expressRequestHook,
    mongoResponseHook,
    redisResponseHook,
} from "./hooks.js";

// Use require for CommonJS modules to avoid ESM interop issues
const { resourceFromAttributes } = require("@opentelemetry/resources");
const {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} = require("@opentelemetry/semantic-conventions");

const log = createModuleLogger("tracing");

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 * MUST be called before any other imports
 */
export function initializeTracing() {
    if (!isTracingEnabled()) {
        log.info("Tracing disabled");
        return null;
    }

    try {
        const { serviceName, serviceVersion, environment, tempo } =
            observabilityConfig.tracing;

        log.info("Initializing OpenTelemetry tracing");

        // Create resource with enhanced service metadata
        const resource = resourceFromAttributes({
            [SEMRESATTRS_SERVICE_NAME]: serviceName,
            [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
            [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
            // Additional production-grade attributes
            "service.namespace": "auth",
            "host.name": observabilityConfig.tracing.hostname || "localhost",
            "process.pid": process.pid,
        });

        // Configure trace exporter
        log.info({ tempoUrl: tempo.url }, "Tempo URL configured");
        log.info(
            { authConfigured: Object.keys(tempo.headers).length > 0 },
            "Auth headers status"
        );

        const traceExporter = tempo.url
            ? new OTLPTraceExporter({
                url: tempo.url,
                headers: tempo.headers as Record<string, string>,
                // Production settings
                timeoutMillis: 30000,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                compression: "gzip" as any,
            })
            : undefined;

        // Configure metric exporter - use dedicated Prometheus/Mimir endpoint
        const prometheusConfig = observabilityConfig.prometheus.remoteWrite;
        const metricExporter = prometheusConfig.enabled && prometheusConfig.url
            ? new OTLPMetricExporter({
                url: prometheusConfig.url,
                headers: prometheusConfig.username && prometheusConfig.password
                    ? { Authorization: `Basic ${Buffer.from(`${prometheusConfig.username}:${prometheusConfig.password}`).toString("base64")}` }
                    : {},
                timeoutMillis: 30000,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                compression: "gzip" as any,
            })
            : undefined;

        // Configure metric reader
        const metricReader = metricExporter
            ? new PeriodicExportingMetricReader({
                exporter: metricExporter,
                exportIntervalMillis: 60000, // Export every 60 seconds
            })
            : undefined;

        // Configure span processor with healthz filter
        const createSpanProcessor = (): SpanProcessor | undefined => {
            if (!traceExporter) return undefined;

            const batchProcessor = new BatchSpanProcessor(traceExporter, {
                maxQueueSize: 2048,
                maxExportBatchSize: 512,
            });

            // Wrap with filtering processor to exclude health check spans
            return new FilteringSpanProcessor(batchProcessor, (span: ReadableSpan) => {
                const name = span.name || "";
                // Exclude healthz, readyz, and metrics endpoints
                return name.includes("/healthz") || name.includes("/readyz") || name.includes("/metrics");
            });
        };

        const spanProcessor = createSpanProcessor();

        // Initialize OpenTelemetry SDK
        sdk = new NodeSDK({
            resource: resource,
            ...(spanProcessor && { spanProcessors: [spanProcessor] }),
            ...(metricReader && { metricReader }),
            // Configure auto-instrumentations
            instrumentations: [
                getNodeAutoInstrumentations({
                    // ========================================
                    // DISABLED: Noisy/Unused Instrumentations
                    // ========================================
                    "@opentelemetry/instrumentation-fs": { enabled: false },
                    "@opentelemetry/instrumentation-dns": { enabled: false },
                    "@opentelemetry/instrumentation-net": { enabled: false },
                    "@opentelemetry/instrumentation-aws-lambda": { enabled: false },
                    "@opentelemetry/instrumentation-aws-sdk": { enabled: false },
                    "@opentelemetry/instrumentation-grpc": { enabled: false },
                    "@opentelemetry/instrumentation-mysql": { enabled: false },
                    "@opentelemetry/instrumentation-mysql2": { enabled: false },
                    "@opentelemetry/instrumentation-pg": { enabled: false },
                    "@opentelemetry/instrumentation-nestjs-core": { enabled: false },
                    "@opentelemetry/instrumentation-graphql": { enabled: false },
                    "@opentelemetry/instrumentation-socket.io": { enabled: false },
                    // ========================================
                    // ENABLED: Essential Instrumentations
                    // ========================================
                    "@opentelemetry/instrumentation-http": {
                        enabled: true,
                        ignoreIncomingRequestHook,
                        requestHook,
                        startOutgoingSpanHook, // eslint-disable-line @typescript-eslint/no-explicit-any
                        applyCustomAttributesOnSpan, // eslint-disable-line @typescript-eslint/no-explicit-any
                    },
                    "@opentelemetry/instrumentation-express": {
                        enabled: true,
                        // Skip noisy middleware spans - keep only router and request_handler spans
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ignoreLayersType: ["middleware" as any],
                        // Ignore health check routes entirely - match by layer name
                        ignoreLayers: [/healthz/, /readyz/],
                        spanNameHook: expressSpanNameHook, // eslint-disable-line @typescript-eslint/no-explicit-any
                        requestHook: expressRequestHook, // eslint-disable-line @typescript-eslint/no-explicit-any
                    },
                    "@opentelemetry/instrumentation-mongodb": {
                        enabled: true,
                        enhancedDatabaseReporting: true, // Include query details
                        responseHook: mongoResponseHook,
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ["@opentelemetry/instrumentation-redis-4" as any]: {
                        enabled: true,
                        responseHook: redisResponseHook,
                    },
                    // ioredis instrumentation
                    "@opentelemetry/instrumentation-ioredis": {
                        enabled: true,
                        responseHook: redisResponseHook,
                    },
                }),
            ],
        });

        sdk.start();
        log.info("OpenTelemetry tracing initialized");

        // Graceful shutdown with timeout
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shutdownHandler = async (signal: any) => {
            log.info({ signal }, "Shutting down OpenTelemetry");
            try {
                await Promise.race([
                    sdk?.shutdown(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Shutdown timeout")), 5000)
                    ),
                ]);
                log.info("OpenTelemetry SDK shut down successfully");
            } catch (error) {
                log.error({ err: error }, "Error shutting down OpenTelemetry SDK");
            } finally {
                process.exit(0);
            }
        };

        process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
        process.on("SIGINT", () => shutdownHandler("SIGINT"));

        return sdk;
    } catch (error) {
        log.error({ err: error }, "Failed to initialize OpenTelemetry");
        // Don't crash the app if tracing fails
        return null;
    }
}

/**
 * Shutdown tracing
 */
export async function shutdownTracing() {
    if (sdk) {
        try {
            await sdk.shutdown();
            log.info("OpenTelemetry SDK shut down");
        } catch (error) {
            log.error({ err: error }, "Error shutting down OpenTelemetry SDK");
        }
    }
}

/**
 * Get the OpenTelemetry SDK instance
 */
export function getTracingSDK() {
    return sdk;
}
