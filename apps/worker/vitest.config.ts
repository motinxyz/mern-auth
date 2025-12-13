import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@auth/api": path.resolve(__dirname, "../api/src/index.ts"),
      "@auth/app-bootstrap": path.resolve(__dirname, "../../packages/app-bootstrap/src/bootstrap.ts"),
      "@auth/config": path.resolve(__dirname, "../../packages/config/src/index.ts"),
      "@auth/contracts": path.resolve(__dirname, "../../packages/contracts/src/index.ts"),
      "@auth/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@auth/database": path.resolve(__dirname, "../../packages/database/src/index.ts"),
      "@auth/email": path.resolve(__dirname, "../../packages/email/src/index.ts"),
      "@auth/eslint-config": path.resolve(__dirname, "../../packages/eslint-config/index.js"),
      "@auth/feature-flags": path.resolve(__dirname, "../../packages/feature-flags/src/index.ts"),
      "@auth/i18n": path.resolve(__dirname, "../../packages/i18n/src/i18n.ts"),
      "@auth/logger": path.resolve(__dirname, "../../packages/logger/src/index.ts"),
      "@auth/observability": path.resolve(__dirname, "../../packages/observability/src/index.ts"),
      "@auth/queues": path.resolve(__dirname, "../../packages/queues/src/index.ts"),
      "@auth/redis": path.resolve(__dirname, "../../packages/redis/src/index.ts"),
      "@auth/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@auth/web": path.resolve(__dirname, "../../packages/web/src/index.ts"),
      "@auth/worker": path.resolve(__dirname, "./src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["**/node_modules/**", "**/__tests__/integration/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
    clearMocks: true,
    restoreMocks: true,
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 35,
        functions: 25,
        branches: 25,
        statements: 35,
      },
      exclude: ["**/__tests__/**", "**/node_modules/**", "**/dist/**"],
    },
  },
});
