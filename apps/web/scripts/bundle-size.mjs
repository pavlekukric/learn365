/**
 * Client-bundle budget for the web app (Phase 9, 2026-09-28).
 *
 * Reads `.next/app-build-manifest.json` after `next build`, sums the client
 * JS every route loads (the union of its page entry and every layout /
 * boundary entry above it, shared chunks counted once), prints the table
 * and exits non-zero when a route or a single chunk crosses the budget.
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

/**
 * The manifest has one entry per *file* of the app tree (`/layout`,
 * `/course/[courseId]/lesson/layout`, `/course/[courseId]/lesson/[lessonId]/page`,
 * …), not per route. A browser opening a page loads the page entry plus every
 * segment file above it — the root layout, each nested layout / template,
 * and the loading / error / not-found boundaries on the way down — so the
 * route's cost is the *union* of those entries' chunks (review 2026-09-30
 * item 14: summing only the page entry missed the layouts' own chunks).
 */
const SEGMENT_FILES = ['layout', 'template', 'loading', 'error', 'not-found'];

/** Manifest keys of the segment files above (and beside) `pageKey`, root first. */
function chainOf(pageKey) {
  const segments = pageKey.split('/').filter(Boolean).slice(0, -1); // drop the trailing `page`
  const keys = [];
  for (let depth = 0; depth <= segments.length; depth += 1) {
    const prefix = segments.slice(0, depth).map((segment) => `/${segment}`).join('');
    for (const file of SEGMENT_FILES) {
      const key = `${prefix}/${file}`;
      if (key in manifest.pages) keys.push(key);
    }
  }
  keys.push(pageKey);
  return keys;
}

/** `/(account)/nalog/page` → `/nalog`; `/page` → `/`. */
function routeOf(pageKey) {
  const path = pageKey
    .replace(/\/page$/, '')
    .split('/')
    .filter((segment) => segment !== '' && !/^\(.*\)$/.test(segment))
    .join('/');
  return `/${path}`;
}

const rows = [];
for (const key of Object.keys(manifest.pages)) {
  // Only page entries are routes. Route handlers (`/api/**`, `/robots.txt`,
  // `/sitemap.xml`) ship no page JS; layouts / boundaries are counted inside
  // every route below them.
  if (!key.endsWith('/page')) continue;
  const chain = chainOf(key);
  const files = new Set(chain.flatMap((entry) => manifest.pages[entry] ?? []));
  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const size = sizeOf(file);
    raw += size.raw;
    gzip += size.gzip;
  }
  rows.push({ route: routeOf(key), raw, gzip, entries: chain.length });
}
rows.sort((a, b) => b.gzip - a.gzip);

console.log(
  'Client JS per route (union of the layout chain + page, from app-build-manifest.json):',
);
for (const row of rows) {
  console.log(
    `  ${row.route.padEnd(44)} ${kb(row.raw).padStart(8)} kB raw ${kb(row.gzip).padStart(7)} kB gzip  (${String(row.entries)} entries)`,
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
