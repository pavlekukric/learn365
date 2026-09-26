import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Monorepo root — the standalone output traces files relative to it. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-hosted image (apps/web/Dockerfile sets NEXT_STANDALONE=1): minimal
  // server bundle under .next/standalone. Opt-in because the tracing step
  // recreates pnpm's symlinks, which Windows refuses without Developer Mode
  // (EPERM) — plain `pnpm build` on a dev machine stays a normal build.
  ...(process.env.NEXT_STANDALONE === '1'
    ? {
        output: 'standalone',
        // pnpm-linked workspace packages are traced because the root is the
        // monorepo root, not apps/web. Kept behind the same switch so the
        // Vercel build (still live until the VPS serves the domain) is untouched.
        outputFileTracingRoot: repoRoot,
      }
    : {}),
  transpilePackages: ['@learn365/ui', '@learn365/ui-web', '@learn365/core', '@learn365/content'],
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
