import pinoHttp, { stdSerializers } from "pino-http";
import { v4 as uuidv4 } from "uuid";
import config from "../config/env.js";
import logger from "../config/logger.js";

// Create a child logger specifically for HTTP requests.
// This ensures the 'module' property is always present and appears first.
const httpModuleLogger = logger.child({ module: "http" });

export const httpLogger = pinoHttp({
  logger: httpModuleLogger,
  // Generate a unique ID for every request.
  // This ID will be automatically included in every log line for this request.
  genReqId: (req, res) => {
    const existingId = req.id || req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = uuidv4();
    res.setHeader("X-Request-Id", id); // Also send it back in the response header
    return id;
  },

  // Use standard serializers for rich, structured logs in production.
  // In development, we disable them for cleaner, more readable logs.
  serializers: config.isDevelopment
    ? {
        // In dev, use minimal serializers for a clean log line.
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      }
    : {
        // In prod, use the rich, standard serializers.
        req: stdSerializers.req,
        res: stdSerializers.res,
      },

  // Use a custom log level to control verbosity.
  // In development, we log successful requests at 'debug' level.
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
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
          messageFormat: "{msg} [{res.statusCode}] {req.method} {req.url} - {responseTime}ms (ID: {req.id})",
        },
      }
    : undefined,
});
