/**
 * PM2 Ecosystem File
 *
 * This file is used by PM2 to manage application processes in a production environment.
 * It allows you to define and configure multiple applications (your web server and worker)
 * in a single place.
 *
 * To use this file:
 * 1. Install PM2 globally: `npm install pm2 -g`
 * 2. Start all applications: `pm2 start ecosystem.config.js --env production`
 * 3. Monitor applications: `pm2 list` or `pm2 monit`
 * 4. View logs: `pm2 logs`
 *
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: "api-server",
      script: "src/server.js",
      instances: "max", // Run on all available CPU cores
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "email-worker",
      script: "src/worker.js",
      instances: 1, // Typically, you only need one worker instance unless it's a bottleneck
    },
  ],
};
