/**
 * Mobile Lighthouse, warn-only (review 2026-10-01, P1 item 3).
 *
 * Starts `next start` on the built app, runs Lighthouse's default mobile
 * profile (Moto G Power, slow 4G, 4× CPU) RUNS times per route, prints the
 * median performance score and LCP, and writes a GitHub `::warning::` for a
 * route under FLOOR. It never fails: a CI runner's timings drift, so this is
 * a tripwire for a regression like Phase 17's font preloads (mobile fell from
 * 82–85 to 61–83 and nothing noticed), not a gate. The hard gates live in
 * `bundle-size.mjs` (JS and font-preload budgets).
 *
 * Local numbers read higher than production (no network latency, no
 * Cloudflare): main at 8361304 scored 81–87 here and 61–83 live. Compare
 * runs with each other, not with the live site.
 *
 * Run: `pnpm --filter @learn365/web lighthouse` after `pnpm build`.
 * Chrome: CHROME_PATH, else Playwright's Chromium. Lighthouse itself comes
 * from `npx lighthouse@<LIGHTHOUSE>` so it is not a dependency of the app.
 */

import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIGHTHOUSE = '12.8.2';
const FLOOR = 82;
const RUNS = 3;
const PORT = 3100;
const ROUTES = [
  ['Home', '/'],
  ['Pregled kursa', '/course/istorija-srbije-365'],
  ['Lekcija (Dan 1)', '/course/istorija-srbije-365/lesson/day-001'],
];

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = `http://localhost:${String(PORT)}`;

function warn(message) {
  console.log(
    process.env['GITHUB_ACTIONS']
      ? `::warning title=Lighthouse::${message}`
      : `WARNING: ${message}`,
  );
}

async function chromePath() {
  if (process.env['CHROME_PATH']) return process.env['CHROME_PATH'];
  const { chromium } = await import('@playwright/test');
  return chromium.executablePath();
}

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`${url} did not answer within ${String(timeoutMs / 1000)} s`);
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function main() {
  const chrome = await chromePath();
  const nextBin = join(webRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const server = spawn(process.execPath, [nextBin, 'start', '--port', String(PORT)], {
    cwd: webRoot,
    stdio: 'ignore',
  });
  const outDir = mkdtempSync(join(tmpdir(), 'lighthouse-'));
  const rows = [];
  try {
    await waitFor(origin, 60_000);
    for (const [name, path] of ROUTES) {
      const scores = [];
      const lcps = [];
      for (let run = 0; run < RUNS; run += 1) {
        const out = join(outDir, 'report.json');
        const result = spawnSync(
          'npx',
          [
            '--yes',
            `lighthouse@${LIGHTHOUSE}`,
            `${origin}${path}`,
            '--only-categories=performance',
            '--chrome-flags=--headless=new --no-sandbox',
            '--output=json',
            `--output-path=${out}`,
            '--quiet',
          ],
          { env: { ...process.env, CHROME_PATH: chrome }, stdio: ['ignore', 'ignore', 'pipe'] },
        );
        if (result.status !== 0) {
          throw new Error(`lighthouse ${path}: ${result.stderr.toString().slice(0, 500)}`);
        }
        /** @type {{ categories: { performance: { score: number } }, audits: Record<string, { numericValue: number }> }} */
        const report = JSON.parse(readFileSync(out, 'utf8'));
        scores.push(Math.round(report.categories.performance.score * 100));
        lcps.push(report.audits['largest-contentful-paint']?.numericValue ?? Number.NaN);
      }
      rows.push({ name, path, score: median(scores), lcp: median(lcps), scores });
    }
  } finally {
    server.kill();
    rmSync(outDir, { recursive: true, force: true });
  }

  const lines = [
    `Mobile Lighthouse ${LIGHTHOUSE}, median of ${String(RUNS)} (warn under ${String(FLOOR)}):`,
    ...rows.map(
      (row) =>
        `  ${row.name.padEnd(18)} ${String(row.score).padStart(3)}  LCP ${(row.lcp / 1000).toFixed(1)} s  (runs ${row.scores.join(' / ')})`,
    ),
  ];
  console.log(lines.join('\n'));

  const summary = process.env['GITHUB_STEP_SUMMARY'];
  if (summary) {
    appendFileSync(
      summary,
      [
        `### Mobile Lighthouse (warn-only, floor ${String(FLOOR)})`,
        '',
        '| Route | Score (median) | LCP | Runs |',
        '|---|---|---|---|',
        ...rows.map(
          (row) =>
            `| ${row.name} \`${row.path}\` | ${row.score < FLOOR ? '⚠️ ' : ''}${String(row.score)} | ${(row.lcp / 1000).toFixed(1)} s | ${row.scores.join(' / ')} |`,
        ),
        '',
      ].join('\n'),
    );
  }

  for (const row of rows) {
    if (row.score < FLOOR) {
      warn(
        `${row.name} (${row.path}) scored ${String(row.score)} on mobile — floor ${String(FLOOR)}.`,
      );
    }
  }
}

main().catch((error) => {
  // Warn-only: an infrastructure failure must not turn CI red either.
  warn(`run did not complete — ${error instanceof Error ? error.message : String(error)}`);
});
