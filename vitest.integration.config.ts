import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Integration tests against the LOCAL Supabase stack only (tests/integration/local-env.ts). Skipped unless
// MCCI_IT_LOCAL=1; never part of `pnpm test`.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
