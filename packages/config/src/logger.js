import pino from "pino";
import config from "./env.js";

const logger = pino({
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

export default logger;