import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // `@/…` mirrors tsconfig `paths`; `server-only` throws outside Next.
      '@': here('.'),
      'server-only': here('./test/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    // Scope to colocated unit tests; Playwright owns the e2e/ directory.
    include: ['app/**/*.test.{ts,tsx}', 'components/**/*.test.{ts,tsx}', 'lib/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    passWithNoTests: true,
    // PGlite boots a WASM Postgres per suite; first start is ~1–2 s.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
