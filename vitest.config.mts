import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/': fileURLToPath(new URL('./src/', import.meta.url)),
      // `server-only` throws outside a React Server environment; tests run server code directly.
      'server-only': fileURLToPath(new URL('./src/shared/testing/empty.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/testing/setup.ts'],
    env: { DATABASE_PATH: ':memory:' },
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
