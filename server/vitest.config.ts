import os from 'node:os';
import { defineConfig } from 'vitest/config';

const isCI = process.env.CI === 'true';
const ciMaxWorkers = Math.min(os.cpus().length, 4);

export default defineConfig({
  test: {
    pool: 'threads',
    maxWorkers: isCI ? ciMaxWorkers : undefined,
    // Testcontainer first-start adds 5-10s; hook setup can run up to 60s on a
    // cold image pull. Keep generous timeouts for integration tests.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    environment: 'node',
    globals: false,
    setupFiles: ['./test/setup.ts'],
    reporters: isCI ? ['default', ['junit', { outputFile: './test-results/junit.xml' }]] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        '**/dist/**',
        '**/migrations/**',
        '**/*.config.{ts,js,mts,mjs,cts,cjs}',
        'src/db/seed.ts',
        'src/db/create-migration.ts',
        '**/*.d.ts',
        '**/types/**',
        'test/**',
      ],
    },
  },
});
