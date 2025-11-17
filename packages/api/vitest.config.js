import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    clearMocks: true, // Clear mock history before each test
    restoreMocks: true, // Restore original module implementations after each test
    isolate: true, // Run each test file in its own isolated environment
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: { // Add resolve alias
    alias: {
      '@auth/core': path.resolve(__dirname, '../core/src'),
      '@auth/email': path.resolve(__dirname, '../email/src'),
      '@auth/config': path.resolve(__dirname, '../config/src'),
      '@auth/database': path.resolve(__dirname, '../database/src'),
      '@auth/queues': path.resolve(__dirname, '../queues/src'),
      '@auth/utils': path.resolve(__dirname, '../utils/src'),
      '@auth/app-bootstrap': path.resolve(__dirname, '../app-bootstrap/src'), // Also add app-bootstrap
    },
  },
});