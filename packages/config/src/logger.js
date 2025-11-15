import pino from "pino";
import config from "./env.js";

let loggerInstance;

export function getLogger() {
  if (!loggerInstance) {
    loggerInstance = pino({
      level: config.logLevel,
      ...(config.isDevelopment && {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      }),
    });
  }
  return loggerInstance;
}