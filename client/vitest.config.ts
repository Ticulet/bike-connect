import os from 'node:os';
import { defineConfig } from 'vitest/config';

const isCI = process.env.CI === 'true';
const ciMaxWorkers = Math.min(os.cpus().length, 4);

export default defineConfig({
  test: {
    pool: 'threads',
    maxWorkers: isCI ? ciMaxWorkers : undefined,
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./test/setup.ts'],
    // Exclude Playwright e2e tests — they are run separately via `npx playwright test`
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    reporters: isCI ? ['default', ['junit', { outputFile: './test-results/junit.xml' }]] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        '**/dist/**',
        '**/migrations/**',
        '**/*.config.{ts,js,mts,mjs,cts,cjs}',
        'src/main.tsx',
        '**/*.d.ts',
        '**/types/**',
        'test/**',
      ],
    },
  },
});
