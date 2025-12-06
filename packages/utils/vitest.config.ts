import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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
});
