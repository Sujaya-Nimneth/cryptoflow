import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: { 'server-only': require.resolve('next/dist/compiled/server-only/empty') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
