import pino from "pino";
import config from "../config/env.js";

const isDev = config.isDevelopment;

const pinoConfig = {
  // Set the minimum log level.
  // In production, you might want to set this to 'info' or 'warn'
  // and control it via environment variables.
  level: config.logLevel || "info",
  // metadata that appears in every log
  // base: {
  //   app: "my-mern-app",
  //   version: "1.0.0",
  //   env: config.env || (isDev ? "development" : "production"),
  // },
};

// In development, we use pino-pretty for nice, human-readable output.
// In production, we'll stick to standard JSON logs for better performance
// and machine-readability.
if (isDev) {
  pinoConfig.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  };
}

export default pino(pinoConfig);
