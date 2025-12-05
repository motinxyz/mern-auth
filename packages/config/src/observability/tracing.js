/**
 * OpenTelemetry Tracing with Grafana Cloud Tempo Integration
 *
 * Features:
 * - Automatic instrumentation (Express, MongoDB, Redis, etc.)
 * - Distributed tracing
 * - Export to Grafana Cloud Tempo
 * - Graceful degradation
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { createModuleLogger } from "../logging/startup-logger.js";

// Use require for CommonJS modules to avoid ESM interop issues
const { resourceFromAttributes } = require("@opentelemetry/resources");
const {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} = require("@opentelemetry/semantic-conventions");
import { observabilityConfig, isTracingEnabled } from "./config.js";

const log = createModuleLogger("tracing");

let sdk = null;

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
      "host.name": process.env.HOSTNAME || "localhost",
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
          headers: tempo.headers,
          // Production settings
          timeoutMillis: 30000,
          compression: "gzip",
        })
      : undefined;

    if (traceExporter) {
      log.info({ url: tempo.url }, "OTLP Trace Exporter created");
    }

    // Sampling strategy: 100% in dev, configurable in prod
    const {
      TraceIdRatioBasedSampler,
      ParentBasedSampler,
    } = require("@opentelemetry/sdk-trace-base");

    const samplingRate = environment === "production" ? 0.1 : 1.0; // 10% in prod, 100% in dev
    const sampler = new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(samplingRate),
    });

    log.info({ samplingRate: samplingRate * 100 }, "Sampling rate configured");

    // Batch span processor for efficient export
    const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
    const spanProcessor = traceExporter
      ? new BatchSpanProcessor(traceExporter, {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000,
        })
      : undefined;

    // =================================================================
    // METRICS CONFIGURATION (Gold Standard: In-Process OTLP Export)
    // =================================================================
    const { prometheus } = observabilityConfig;
    let metricReader;

    if (prometheus.remoteWrite.enabled && prometheus.remoteWrite.url) {
      log.info(
        { url: prometheus.remoteWrite.url },
        "Configuring OTLP Metrics Exporter"
      );

      const metricExporter = new OTLPMetricExporter({
        url: prometheus.remoteWrite.url,
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${prometheus.remoteWrite.username}:${prometheus.remoteWrite.password}`
          ).toString("base64")}`,
        },
        // Protobuf encoding is default for OTLP/HTTP
        concurrencyLimit: 10, // Limit concurrent exports
      });

      metricReader = new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 15000, // Export every 15 seconds
        exportTimeoutMillis: 10000,
      });

      log.info("OTLP Metrics Exporter configured");
    }

    // Initialize SDK with production-grade configuration
    sdk = new NodeSDK({
      resource,
      spanProcessor,
      sampler,
      metricReader, // Add metric reader to SDK
      instrumentations: [
        getNodeAutoInstrumentations({
          // ... (existing instrumentations)
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
            ignoreIncomingRequestHook: (req) => {
              // Don't trace health checks and metrics endpoints
              const url = req.url || "";
              return url.includes("/health") || url.includes("/metrics");
            },
            // Hook for incoming requests (server-side)
            requestHook: (span, request) => {
              // Add request details
              span.setAttribute("http.url", request.url);
              span.setAttribute(
                "http.host",
                request.headers?.host || "unknown"
              );
            },
            // Hook for outgoing requests (client-side) - for external API calls
            startOutgoingSpanHook: (request) => {
              // Parse URL to get host for span name
              const url = request.path || request.href || "";
              const method = request.method || "GET";

              // Try to extract hostname for better span names
              let host = request.hostname || request.host || "";
              if (host) {
                // Remove port if present
                host = host.split(":")[0];
                return { name: `HTTP ${method} ${host}` };
              }
              return { name: `HTTP ${method}` };
            },
            // This hook runs after response is complete - route info is available
            applyCustomAttributesOnSpan: (span, request, response) => {
              // For incoming requests: Update HTTP span name with Express route
              const route = request.route?.path;
              const baseUrl = request.baseUrl || "";
              const method = request.method || "GET";

              if (route) {
                // Full route path for nested routers
                const fullRoute = baseUrl + route;
                span.updateName(`${method} ${fullRoute}`);
                span.setAttribute("http.route", fullRoute);
              } else if (request.originalUrl) {
                // Fallback to original URL (without query params)
                const path = request.originalUrl.split("?")[0];
                span.updateName(`${method} ${path}`);
              }
            },
          },
          "@opentelemetry/instrumentation-express": {
            enabled: true,
            // Skip noisy middleware spans - keep only router and request_handler spans
            ignoreLayersType: ["middleware"],
            // spanNameHook is the correct hook for setting span names
            spanNameHook: (info, defaultName) => {
              const req = info.request;
              const route = info.route || req.route?.path;
              const method = req.method || "UNKNOWN";

              // Use route if available, otherwise fall back to URL path
              if (route) {
                return `${method} ${route}`;
              }
              // Use baseUrl + path for nested routers
              const path = req.baseUrl
                ? `${req.baseUrl}${req.path || ""}`
                : req.originalUrl || req.url;
              return `${method} ${path}`;
            },
            // requestHook for adding attributes (not span name)
            requestHook: (span, info) => {
              const req = info.request;
              span.setAttribute("http.target", req.originalUrl || req.url);
              span.setAttribute("express.type", info.layerType || "middleware");
              if (info.route) {
                span.setAttribute("http.route", info.route);
              }
            },
          },
          "@opentelemetry/instrumentation-mongodb": {
            enabled: true,
            enhancedDatabaseReporting: true, // Include query details
            responseHook: (span, result) => {
              // Add operation result info
              if (result.operationName) {
                span.updateName(`MongoDB ${result.operationName}`);
              }
            },
          },
          "@opentelemetry/instrumentation-redis-4": {
            enabled: true,
            responseHook: (span, cmdName, cmdArgs, response) => {
              // Add Redis command info to span name
              span.updateName(`Redis ${cmdName}`);
              span.setAttribute("redis.command", cmdName);
            },
          },
        }),
      ],
    });

    sdk.start();
    log.info("OpenTelemetry tracing initialized");

    // Graceful shutdown with timeout
    const shutdownHandler = async (signal) => {
      log.info({ signal }, "Shutting down OpenTelemetry");
      try {
        await Promise.race([
          sdk.shutdown(),
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
