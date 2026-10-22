import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    // `server-only` throws outside a React Server Component bundle; tests import server modules directly.
    alias: { 'server-only': fileURLToPath(new URL('./tests/unit/stubs/server-only.ts', import.meta.url)) },
  },
});
