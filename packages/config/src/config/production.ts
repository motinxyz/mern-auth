// packages/config/src/config/production.ts
// Production-specific configurations

export default {
  logLevel: "info",
  worker: {
    concurrency: 10,
    attempts: 5,
    stalledInterval: 30000,
  },
  // In a production environment, sensitive variables like database credentials,
  // API keys should be loaded from a secure secret management system
  // (e.g., AWS Secrets Manager, Google Secret Manager, HashiCorp Vault)
  // rather than being hardcoded or stored in .env files directly in the repository.

  // Example: Production-specific feature flags
  // featureFlags: {
  //   newDashboard: false,
  // },
};
