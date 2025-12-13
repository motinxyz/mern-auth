import type { IncomingMessage } from "http";
import type { Span } from "@opentelemetry/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Ignore incoming request hook
 * Filters out health checks and metric endpoints from tracing.
 */
export const ignoreIncomingRequestHook = (req: IncomingMessage): boolean => {
    // Don't trace health checks and metrics endpoints
    const url = req.url || "";
    return url.startsWith("/healthz") || url.startsWith("/readyz") || url.includes("/metrics");
};

/**
 * Request hook for HTTP instrumentation (server-side)
 */
export const requestHook = (span: Span, request: any): void => {
    // Add request details
    span.setAttribute("http.url", request.url || "");
    span.setAttribute(
        "http.host",
        request.headers?.host || "unknown"
    );
};

/**
 * Start outgoing span hook for HTTP instrumentation (client-side)
 */
export const startOutgoingSpanHook = (request: any): any => {
    // Parse URL to get host for span name
    const method = request.method || "GET";

    // Try to extract hostname for better span names
    let host = request.hostname || request.host || "";
    if (host) {
        // Remove port if present
        host = host.split(":")[0];
        return { name: `HTTP ${method} ${host}` };
    }
    return { name: `HTTP ${method}` };
};

/**
 * Apply custom attributes on span hook
 * Runs after response is complete - route info is available
 */
export const applyCustomAttributesOnSpan = (span: Span, request: any, _response: any): void => {
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
};

/**
 * Express Instrumentation Span Name Hook
 */
export const expressSpanNameHook = (info: any, _defaultName: any): string => {
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
};

/**
 * Express Request Hook (Adding Attributes)
 */
export const expressRequestHook = (span: any, info: any): void => {
    const req = info.request;
    span.setAttribute("http.target", req.originalUrl || req.url);
    span.setAttribute("express.type", info.layerType || "middleware");
    if (info.route) {
        span.setAttribute("http.route", info.route);
    }
};

/**
 * MongoDB Response Hook
 */
export const mongoResponseHook = (span: any, result: any): void => {
    // Add operation result info
    if (result.operationName) {
        span.updateName(`MongoDB ${result.operationName}`);
    }
};

/**
 * Redis Response Hook
 */
export const redisResponseHook = (span: any, cmdName: any, _cmdArgs: any, _response: any): void => {
    // Add Redis command info to span name
    span.updateName(`Redis ${cmdName}`);
    span.setAttribute("redis.command", cmdName);
};
