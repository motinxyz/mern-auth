import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    isolate: true,

    // Exclude integration tests from unit test runs
    exclude: ["**/node_modules/**", "**/__tests__/integration/**"],

    // Timeouts
    testTimeout: 30000, // 30 seconds for unit tests
    hookTimeout: 30000, // 30 seconds for unit tests

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      exclude: ["**/__tests__/**", "**/node_modules/**", "**/dist/**"],
    },
  },
});
