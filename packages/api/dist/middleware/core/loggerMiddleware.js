/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions */
import pinoHttp, { stdSerializers } from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { config, getLogger } from "@auth/config";
import { trace } from "@opentelemetry/api";
const logger = getLogger();
// Create a child logger specifically for HTTP requests.
// This ensures the 'module' property is always present and appears first.
const httpModuleLogger = logger.child({ module: "http" });
export const httpLogger = pinoHttp({
    logger: httpModuleLogger,
    // Generate a unique ID for every request.
    // This ID will be automatically included in every log line for this request.
    genReqId: (req, res) => {
        const existingId = req.id || req.headers["x-request-id"];
        if (existingId)
            return existingId;
        const id = uuidv4();
        res.setHeader("X-Request-Id", id); // Also send it back in the response header
        return id;
    },
    // Add custom properties to every log entry
    customProps: (req, _res) => {
        // Extract OpenTelemetry trace context
        const span = trace.getActiveSpan();
        const spanContext = span?.spanContext();
        return {
            requestId: req.id,
            userId: req.user?.id || req.user?._id, // Support both id and _id
            userEmail: req.user?.email,
            ip: req.ip ||
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            // OpenTelemetry trace correlation
            traceId: spanContext?.traceId,
            spanId: spanContext?.spanId,
            traceFlags: spanContext?.traceFlags,
        };
    },
    // Use standard serializers for rich, structured logs in production.
    // In development, we disable them for cleaner, more readable logs.
    serializers: config.isDevelopment
        ? {
            // In dev, use minimal serializers for a clean log line.
            req: (req) => ({
                method: req.method,
                url: req.url,
                userId: req.raw.user?.id || req.raw.user?._id,
            }),
            res: (res) => ({ statusCode: res.statusCode }),
        }
        : {
            // In prod, use enhanced serializers with user context
            req: (req) => ({
                ...stdSerializers.req(req),
                userId: req.raw.user?.id || req.raw.user?._id,
                userEmail: req.raw.user?.email,
            }),
            res: stdSerializers.res,
            err: stdSerializers.err,
        },
    // Use a custom log level to control verbosity.
    // In development, we log successful requests at 'debug' level.
    customLogLevel: function (_req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            return "warn";
        }
        else if (res.statusCode >= 500 || err) {
            return "error";
        }
        else if (res.statusCode >= 300 && res.statusCode < 400) {
            return "silent";
        }
        return "info";
    },
    // In development, use pino-pretty for nicely formatted, colorized logs.
    // In production, this is disabled, and raw JSON logs are produced.
    transport: config.isDevelopment
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                sync: true,
                // Ignore verbose properties for cleaner development logs
                ignore: "pid,hostname,req,res",
                // Create a custom, concise log line format for HTTP requests
                messageFormat: "{msg} [{res.statusCode}] {req.method} {req.url} - {responseTime}ms (ID: {req.id}) {userId}",
            },
        }
        : undefined,
});
//# sourceMappingURL=loggerMiddleware.js.map