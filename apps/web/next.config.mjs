import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Monorepo root — the standalone output traces files relative to it. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Security headers on every response (Phase 14, review P2 item 20).
 *
 * The CSP has no nonce: a nonce needs a per-request render, which would undo
 * the 373 prerendered pages (Phase 9). `'unsafe-inline'` for scripts is what a
 * static Next app can promise — it still confines every load to this origin.
 * Fonts are self-served by next/font (`/_next/static/media`); the only foreign
 * image is the Google profile picture. `next dev` needs eval for HMR.
 * Playwright runs against `next start`, so a CSP that broke hydration would
 * fail CI.
 *
 * One foreign script origin is allowed: Cloudflare Web Analytics (owner
 * decision 2026-09-29). Cloudflare injects the beacon into the HTML at the
 * edge; it sets no cookie and reports to this origin (`/cdn-cgi/rum`), so
 * `connect-src` stays 'self'. `/privatnost` says what it records — the two
 * change together (`e2e/privacy.spec.ts`).
 */
const isProductionBuild = process.env.NODE_ENV === 'production';
const VISIT_STATISTICS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${VISIT_STATISTICS_SCRIPT_ORIGIN}${isProductionBuild ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.googleusercontent.com",
  "font-src 'self'",
  `connect-src 'self'${isProductionBuild ? '' : ' ws:'}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS only from a production build: a browser that saw it over http://localhost would ignore it anyway.
  ...(isProductionBuild
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
  // Self-hosted image (apps/web/Dockerfile sets NEXT_STANDALONE=1): minimal
  // server bundle under .next/standalone. Opt-in because the tracing step
  // recreates pnpm's symlinks, which Windows refuses without Developer Mode
  // (EPERM) — plain `pnpm build` on a dev machine stays a normal build.
  ...(process.env.NEXT_STANDALONE === '1'
    ? {
        output: 'standalone',
        // pnpm-linked workspace packages are traced because the root is the
        // monorepo root, not apps/web. Kept behind the same switch so the
        // non-standalone build (local `next build`, CI) is untouched.
        outputFileTracingRoot: repoRoot,
      }
    : {}),
  // Lesson figures (review 2026-10-03 P2 9). AVIF first, WebP otherwise. The
  // optimizer's answers are cached for a year, so a replaced plate must get a
  // new file name — its old URL would keep serving the cached copy (the 60 s
  // default before this block means nothing older is out there). The width
  // ladder stops at the
  // 1440 px originals — 1920 / 2048 / 3840 only re-served the same pixels.
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1440],
  },
  transpilePackages: ['@learn365/ui', '@learn365/ui-web', '@learn365/core', '@learn365/content'],
  // PGlite (Postgres in WASM) is the laptop / test database only. It must stay
  // a plain `require` at runtime (WASM + worker files) and must never be
  // traced into the production image, where DATABASE_URL is postgres://.
  serverExternalPackages: ['@electric-sql/pglite'],
  outputFileTracingExcludes: {
    '*': [
      '**/node_modules/@electric-sql/pglite/**',
      '**/node_modules/.pnpm/@electric-sql+pglite*/**',
    ],
  },
  typedRoutes: true,
  webpack(config) {
    // Workspace packages author imports with explicit ".js" extensions
    // (TS `moduleResolution: Bundler` style). Teach webpack to resolve
    // those back to their .ts / .tsx source files so transpilePackages works.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
