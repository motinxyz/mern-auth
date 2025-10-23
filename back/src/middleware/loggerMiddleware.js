import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";
import config from "../config/env.js";
import logger from "../config/logger.js";

export const httpLogger = pinoHttp({
  logger,
  // Generate a unique ID for every request.
  // This ID will be automatically included in every log line for this request.
  genReqId: (req, res) => {
    const existingId = req.id || req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = uuidv4();
    res.setHeader("X-Request-Id", id); // Also send it back in the response header
    return id;
  },
  customProps: (_req, _res) => ({
    module: "http",
  }),

  // In development, we want concise request logs.
  // In production, we want the full structured JSON logs.
  ...(config.isDevelopment && {
    // Define serializers for the request and response objects.
    serializers: {
      req(req) {
        // Only log the method and url.
        return {
          method: req.method,
          url: req.url,
        };
      },
      // The response object is huge, let's just grab the status code.
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
});
