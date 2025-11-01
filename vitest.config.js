// vitest.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true, // Use expect, describe, etc. globally
    environment: 'node',
    // Use a setup file to ensure env variables are loaded before any other code.
    setupFiles: [path.resolve(__dirname, './apps/api-server/tests/setup.js')],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/api-server/src'),
    },
  },
});
