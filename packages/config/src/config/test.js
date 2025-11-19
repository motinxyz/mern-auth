/* eslint-disable import/no-unused-modules */
// packages/config/src/config/test.js
// Test-specific configurations

export default {
  logLevel: "silent", // Suppress logs during tests for cleaner output
  // Example: Override database or Redis settings for testing
  // dbURI: "mongodb://localhost:27017/test_db",
  // redisUrl: "redis://localhost:6379/1", // Use a different Redis DB for tests
  // Example: Test-specific feature flags
  // featureFlags: {
  //   mockExternalService: true,
  // },
};