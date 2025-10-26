import config from "../config/env.js";
import { createClient } from "redis";
import logger, { t as systemT } from "../config/system-logger.js";

const redisLogger = logger.child({ module: "redis" });
// Create a single Redis client instance.
// The `rediss://` protocol implies a TLS connection.
// We explicitly define the socket options for clarity.
// redisLogger.info( config);

const client = createClient({
  url: config.redisUrl,
  socket: {
    tls: config.redisUrl.startsWith("rediss://"),
    rejectUnauthorized: !config.isDevelopment,
  },
});

client.on("error", (err) => {
  // Use the application's logger for consistent error handling.
  // This prevents the app from crashing on Redis connection issues.
  redisLogger.error({ err }, systemT("common:system.redisClientError"));
});

// We connect the client when the module is first loaded.
// The `await` here will pause the loading of this module until the connection
// is established. This is often desirable to ensure Redis is ready before
// the rest of the app starts trying to use it.
await client.connect();
redisLogger.info(systemT("common:system.redisConnected"));

export default client;
