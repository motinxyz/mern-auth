import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@auth/api": path.resolve(__dirname, "../api/src/index.ts"),
      "@auth/app-bootstrap": path.resolve(__dirname, "../app-bootstrap/src/bootstrap.ts"),
      "@auth/config": path.resolve(__dirname, "../config/src/index.ts"),
      "@auth/contracts": path.resolve(__dirname, "../contracts/src/index.ts"),
      "@auth/core": path.resolve(__dirname, "../core/src/index.ts"),
      "@auth/database": path.resolve(__dirname, "../database/src/index.ts"),
      "@auth/email": path.resolve(__dirname, "../email/src/index.ts"),
      "@auth/eslint-config": path.resolve(__dirname, "../eslint-config/index.js"),
      "@auth/i18n": path.resolve(__dirname, "../i18n/src/i18n.ts"),
      "@auth/logger": path.resolve(__dirname, "../logger/src/index.ts"),
      "@auth/observability": path.resolve(__dirname, "../observability/src/index.ts"),
      "@auth/queues": path.resolve(__dirname, "../queues/src/index.ts"),
      "@auth/redis": path.resolve(__dirname, "../redis/src/index.ts"),
      "@auth/utils": path.resolve(__dirname, "../utils/src/index.ts"),
      "@auth/web": path.resolve(__dirname, "../web/src/index.ts"),
      "@auth/worker": path.resolve(__dirname, "../worker/src/index.ts"),
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
