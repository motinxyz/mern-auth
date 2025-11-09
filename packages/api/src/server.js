import app from "./app.js";
import { config, logger, initI18n, t } from "@auth/config";
import mongoose, { connectDB, disconnectDB } from "@auth/database";

async function startServer() {
  try {
    await initI18n();
    await connectDB();
    const server = app.listen(config.port, () => {
      logger.info(t("system:server.startSuccess", { port: config.port }));
    });
    return server;
  } catch (error) {
    logger.error(t("system:server.startError"), error);
    process.exit(1);
  }
}

const server = await startServer();

const gracefulShutdown = async () => {
  logger.info(t("system:process.shutdownSignal", { signal: "SIGTERM" }));
  server.close(async () => {
    logger.info(t("system:server.closeSuccess"));
    await disconnectDB();
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
