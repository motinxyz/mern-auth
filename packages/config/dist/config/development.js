// packages/config/src/config/development.js
// packages/config/src/config/development.js
// Development-specific configurations
export default {
    logLevel: "debug",
    // Example: If your client app runs on a different port in development
    // clientUrl: "http://localhost:3000",
    // Example: Development-specific feature flags
    // featureFlags: {
    //   newDashboard: true,
    // },
    worker: {
        concurrency: 2,
        attempts: 2,
        stalledInterval: 120000,
    },
};
//# sourceMappingURL=development.js.map