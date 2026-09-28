/**
 * Client-bundle budget for the web app (Phase 9, 2026-09-28).
 *
 * Reads `.next/app-build-manifest.json` after `next build`, sums the client
 * JS every route loads (its own chunks plus the shared ones), prints the
 * table and exits non-zero when a route or a single chunk crosses the budget.
 *
 * Why: before Phase 9 the whole 365-lesson corpus (824 kB gzip) sat in the
 * layout's client graph, so every route — `/privatnost` included — paid for
 * it. After the split a route is 100–141 kB gzip (measured 2026-09-28); the
 * budget below is a ceiling with ~25 % headroom, not a target. A heavy field
 * creeping back into `LessonSummary`, or a client import of the article
 * entry, fails this check.
 *
 * Run: `pnpm --filter @learn365/web check-bundle` (after `pnpm build`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROUTE_BUDGET_GZIP_KB = 175;
const CHUNK_BUDGET_RAW_KB = 300;

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = join(webRoot, '.next');
const manifestPath = join(nextDir, 'app-build-manifest.json');

if (!existsSync(manifestPath)) {
  console.error(`bundle-size: ${manifestPath} not found — run \`next build\` first.`);
  process.exit(2);
}

/** @type {{ pages: Record<string, string[]> }} */
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

/** @type {Map<string, { raw: number, gzip: number }>} */
const chunkSizes = new Map();

function sizeOf(file) {
  let entry = chunkSizes.get(file);
  if (!entry) {
    const bytes = readFileSync(join(nextDir, file));
    entry = { raw: bytes.length, gzip: gzipSync(bytes).length };
    chunkSizes.set(file, entry);
  }
  return entry;
}

const kb = (n) => (n / 1024).toFixed(1);

const rows = [];
for (const [route, files] of Object.entries(manifest.pages)) {
  // Route handlers (`/api/**`, `/robots.txt`, `/sitemap.xml`) ship no page
  // JS of their own; the manifest lists only the shared runtime for them.
  if (route.endsWith('/route')) continue;
  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const size = sizeOf(file);
    raw += size.raw;
    gzip += size.gzip;
  }
  rows.push({ route, raw, gzip });
}
rows.sort((a, b) => b.gzip - a.gzip);

console.log('Client JS per route (own chunks + shared, from app-build-manifest.json):');
for (const row of rows) {
  console.log(
    `  ${row.route.padEnd(44)} ${kb(row.raw).padStart(8)} kB raw ${kb(row.gzip).padStart(7)} kB gzip`,
  );
}

const largest = [...chunkSizes.entries()].sort((a, b) => b[1].raw - a[1].raw).slice(0, 5);
console.log('Largest chunks:');
for (const [file, size] of largest) {
  console.log(
    `  ${file.padEnd(44)} ${kb(size.raw).padStart(8)} kB raw ${kb(size.gzip).padStart(7)} kB gzip`,
  );
}

const overRoutes = rows.filter((row) => row.gzip > ROUTE_BUDGET_GZIP_KB * 1024);
const overChunks = [...chunkSizes.entries()].filter(
  ([, size]) => size.raw > CHUNK_BUDGET_RAW_KB * 1024,
);

if (overRoutes.length > 0 || overChunks.length > 0) {
  for (const row of overRoutes) {
    console.error(
      `bundle-size: route ${row.route} is ${kb(row.gzip)} kB gzip — budget ${String(ROUTE_BUDGET_GZIP_KB)} kB.`,
    );
  }
  for (const [file, size] of overChunks) {
    console.error(
      `bundle-size: chunk ${file} is ${kb(size.raw)} kB raw — budget ${String(CHUNK_BUDGET_RAW_KB)} kB.`,
    );
  }
  process.exit(1);
}

console.log(
  `bundle-size: OK — every route ≤ ${String(ROUTE_BUDGET_GZIP_KB)} kB gzip, every chunk ≤ ${String(CHUNK_BUDGET_RAW_KB)} kB raw.`,
);
