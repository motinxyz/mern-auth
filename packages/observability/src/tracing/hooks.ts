
import type { IncomingMessage } from "http";
import type { Span } from "@opentelemetry/api";

/**
 * Ignore incoming request hook
 * Filters out health checks and metric endpoints from tracing.
 */
export const ignoreIncomingRequestHook = (req: IncomingMessage): boolean => {
    // Don't trace health checks and metrics endpoints
    const url = req.url ?? "";
    return url.startsWith("/healthz") || url.startsWith("/readyz") || url.includes("/metrics");
};

/**
 * Request hook for HTTP instrumentation (server-side)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const requestHook = (span: Span, request: any): void => {
    // Add request details
    span.setAttribute("http.url", (request.url as string | undefined) ?? "");
    span.setAttribute(
        "http.host",
        (request.headers?.host as string | undefined) ?? "unknown"
    );
};

/**
 * Start outgoing span hook for HTTP instrumentation (client-side)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const startOutgoingSpanHook = (request: any): any => {
    // Parse URL to get host for span name
    const method = (request.method as string | undefined) ?? "GET";

    // Try to extract hostname for better span names
    let host = (request.hostname as string | undefined) ?? (request.host as string | undefined) ?? "";
    if (host !== "") {
        // Remove port if present
        host = host.split(":")[0] ?? "";
        return { name: `HTTP ${method} ${host}` };
    }
    return { name: `HTTP ${method}` };
};

/**
 * Apply custom attributes on span hook
 * Runs after response is complete - route info is available
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const applyCustomAttributesOnSpan = (span: Span, request: any, _response: any): void => {
    // For incoming requests: Update HTTP span name with Express route
    const route = request.route?.path as string | undefined;
    const baseUrl = (request.baseUrl as string | undefined) ?? "";
    const method = (request.method as string | undefined) ?? "GET";

    if (typeof route === "string") {
        // Full route path for nested routers
        const fullRoute = baseUrl + route;
        span.updateName(`${method} ${fullRoute}`);
        span.setAttribute("http.route", fullRoute);
    } else if (typeof request.originalUrl === "string") {
        // Fallback to original URL (without query params)
        const path = (request.originalUrl as string).split("?")[0];
        span.updateName(`${method} ${path}`);
    }
};

/**
 * Express Instrumentation Span Name Hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expressSpanNameHook = (info: any, _defaultName: any): string => {
    const req = info.request;
    const route = (info.route as string | undefined) ?? (req.route?.path as string | undefined);
    const method = (req.method as string | undefined) ?? "UNKNOWN";

    // Use route if available, otherwise fall back to URL path
    if (typeof route === "string") {
        return `${method} ${route}`;
    }
    // Use baseUrl + path for nested routers
    const path = ((req.baseUrl as string | undefined) ?? "") !== ""
        ? `${req.baseUrl as string}${req.path as string || ""}`
        : (req.originalUrl as string | undefined) ?? (req.url as string | undefined); // Fallback

    // Final fallback if everything is undefined (shouldn't happen in valid requests)
    return `${method} ${path ?? ""}`;
};

/**
 * Express Request Hook (Adding Attributes)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expressRequestHook = (span: any, info: any): void => {
    const req = info.request;
    span.setAttribute("http.target", (req.originalUrl as string | undefined) ?? (req.url as string | undefined));
    span.setAttribute("express.type", (info.layerType as string | undefined) ?? "middleware");
    if (typeof info.route === "string") {
        span.setAttribute("http.route", info.route);
    }
};

/**
 * MongoDB Response Hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mongoResponseHook = (span: any, result: any): void => {
    // Add operation result info
    if (typeof result.operationName === "string") {
        span.updateName(`MongoDB ${result.operationName}`);
    }
};

/**
 * Redis Response Hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const redisResponseHook = (span: any, cmdName: any, _cmdArgs: any, _response: any): void => {
    // Add Redis command info to span name
    span.updateName(`Redis ${cmdName as string}`);
    span.setAttribute("redis.command", cmdName);
};
