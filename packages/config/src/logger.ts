/**
 * Logger Factory
 * Uses the observability module for production-grade logging
 */

import type { Logger } from "pino";
import { getObservabilityLogger } from "./observability/logger.js";

let loggerInstance: Logger | undefined;

export function getLogger() {
  if (loggerInstance === undefined) {
    loggerInstance = getObservabilityLogger({
      redact: {
        paths: [
          "password",
          "token",
          "secret",
          "apiKey",
          "authorization",
          "cookie",
          "*.password",
          "*.token",
          "*.secret",
        ],
        remove: true,
      },
    });
  }
  return loggerInstance;
}
