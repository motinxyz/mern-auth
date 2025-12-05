/**
 * Observability Shipper Service
 *
 * Lightweight service that ships metrics and logs to Grafana Cloud
 * Runs in the same process as the API server (like the email worker)
 *
 * Features:
 * - Scrapes /metrics endpoint → Ships to Prometheus
 * - Tails log file → Ships to Loki
 * - Zero external dependencies
 * - Runs in background
 */

import fs from "fs";
import { Tail } from "tail";
import dns from "node:dns";
import { createModuleLogger } from "../logging/startup-logger.js";

const log = createModuleLogger("shipper");

// Force IPv4 preference for all network connections in this module
// This fixes ETIMEDOUT errors when shipping to Grafana Cloud
dns.setDefaultResultOrder("ipv4first");
log.info({ dnsOrder: dns.getDefaultResultOrder() }, "Shipper DNS configured");

export class ObservabilityShipperService {
  constructor(options = {}) {
    this.logger = options.logger;
    this.config = options.config;
    this.metricsInterval = null;
    this.logTail = null;
    this.isRunning = false;
  }

  /**
   * Start the shipper service
   * Note: Metrics are shipped via OTLP in tracing.js, this service only handles log tailing to Loki
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn(
        { module: "shipper" },
        "Observability shipper already running"
      );
      return;
    }

    this.logger.info({ module: "shipper" }, "Starting log shipper service...");

    try {
      // Start log tailing to Loki
      await this.startLogTailing();

      this.isRunning = true;
      this.logger.info(
        { module: "shipper" },
        "Log shipper started successfully"
      );
    } catch (error) {
      this.logger.error(
        { error, module: "shipper" },
        "Failed to start log shipper"
      );
      throw error;
    }
  }

  // Note: Metrics are shipped via OpenTelemetry OTLP in tracing.js
  // No need for manual metrics scraping - removed redundant code

  /**
   * Tail log file and ship to Loki
   */
  async startLogTailing() {
    const lokiUrl = process.env.GRAFANA_LOKI_URL;
    const lokiUser = process.env.GRAFANA_LOKI_USER;
    const lokiApiKey = process.env.GRAFANA_LOKI_API;

    if (!lokiUrl || !lokiUser || !lokiApiKey) {
      this.logger.warn(
        "Loki credentials not configured, skipping log shipping"
      );
      return;
    }

    const logFile = "./logs/app.log";

    if (!fs.existsSync(logFile)) {
      this.logger.warn(`Log file not found: ${logFile}`);
      return;
    }

    // Batch logs before sending
    let logBatch = [];
    const batchSize = 100;
    const batchInterval = 5000; // 5 seconds

    // Tail the log file
    this.logTail = new Tail(logFile, {
      fromBeginning: false,
      follow: true,
      useWatchFile: true,
    });

    this.logTail.on("line", (line) => {
      try {
        const logEntry = JSON.parse(line);
        logBatch.push(logEntry);

        // Send batch if it reaches the size limit
        if (logBatch.length >= batchSize) {
          this.shipLogsToLoki(logBatch, lokiUrl, lokiUser, lokiApiKey);
          logBatch = [];
        }
      } catch (error) {
        // Skip non-JSON lines
      }
    });

    this.logTail.on("error", (error) => {
      this.logger.error({ error }, "Log tail error");
    });

    // Send batch periodically
    setInterval(() => {
      if (logBatch.length > 0) {
        this.shipLogsToLoki(logBatch, lokiUrl, lokiUser, lokiApiKey);
        logBatch = [];
      }
    }, batchInterval);

    this.logger.info({ module: "shipper" }, "Log tailing started");
  }

  /**
   * Ship logs to Loki
   */
  async shipLogsToLoki(logs, url, user, apiKey) {
    try {
      const streams = [
        {
          stream: {
            job: "auth-api",
            environment: this.config.env,
            service_name: process.env.OTEL_SERVICE_NAME || "devs-daily",
          },
          values: logs.map((log) => [
            String(new Date(log.time).getTime() * 1000000), // Nanoseconds
            JSON.stringify(log),
          ]),
        },
      ];

      const auth = Buffer.from(`${user}:${apiKey}`).toString("base64");
      const body = JSON.stringify({ streams });

      // Use native https module with IPv4 family to bypass fetch DNS issues
      const https = await import("node:https");
      const urlObj = new URL(`${url}/loki/api/v1/push`);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname,
        method: "POST",
        family: 4, // Force IPv4
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Basic ${auth}`,
        },
      };

      await new Promise((resolve, reject) => {
        const req = https.default.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              this.logger.debug(`Shipped ${logs.length} logs to Loki`);
              resolve();
            } else {
              this.logger.error(
                { status: res.statusCode, body: data },
                "Failed to ship logs to Loki"
              );
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on("error", (error) => reject(error));
        req.write(body);
        req.end();
      });
    } catch (error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            code: error.code,
            cause: error.cause
              ? {
                  message: error.cause.message,
                  code: error.cause.code,
                  errors: error.cause.errors?.map((e) => ({
                    message: e.message,
                    code: e.code,
                    address: e.address,
                    port: e.port,
                  })),
                }
              : undefined,
          },
          targetUrl: `${url}/loki/api/v1/push`,
        },
        "Error shipping logs to Loki"
      );
    }
  }

  /**
   * Stop the shipper service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.logger.info({ module: "shipper" }, "Stopping log shipper service...");

    // Stop log tailing
    if (this.logTail) {
      this.logTail.unwatch();
      this.logTail = null;
    }

    this.isRunning = false;
    this.logger.info({ module: "shipper" }, "Log shipper stopped");
  }

  /**
   * Get shipper status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      logTailingActive: !!this.logTail,
    };
  }
}
