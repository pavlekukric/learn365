/**
 * Vitest stand-in for the `server-only` package. In Next the real module is
 * empty under the `react-server` condition and throws everywhere else, which
 * is exactly what guards the `./server` entry from client bundles — but it
 * would also throw in a plain Node test run. `vitest.config.ts` aliases it
 * here (same arrangement as `apps/web/test/server-only.ts`).
 */
export {};
