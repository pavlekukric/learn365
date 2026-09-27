import 'server-only';

import path from 'node:path';

/**
 * Runtime server configuration, read from the process environment on every
 * call (cheap, and it keeps tests free to set variables per case).
 *
 * All four of `DATABASE_URL`, `APP_URL`, `GOOGLE_CLIENT_ID` and
 * `GOOGLE_CLIENT_SECRET` must be present for accounts to be enabled. With
 * any of them missing the app runs exactly as before Phase 8: reading works,
 * progress stays in the browser, no sign-in surface is rendered. That is
 * the mode CI, Playwright and a dark deploy run in — nothing here is baked
 * into the image at build time.
 */
export interface GoogleOAuthConfig {
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface ServerEnv {
  /** `postgres://…` (production) or `pglite://<dir>` (laptop / tests). */
  readonly databaseUrl: string | null;
  /** Public origin without a trailing slash, e.g. `https://istorija365.com`. */
  readonly appUrl: string | null;
  readonly google: GoogleOAuthConfig | null;
  /** Folder with the drizzle-kit SQL migrations applied at server start. */
  readonly migrationsDir: string;
}

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getServerEnv(): ServerEnv {
  const appUrl = nonEmpty(process.env.APP_URL);
  const clientId = nonEmpty(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = nonEmpty(process.env.GOOGLE_CLIENT_SECRET);
  return {
    databaseUrl: nonEmpty(process.env.DATABASE_URL),
    appUrl: appUrl === null ? null : appUrl.replace(/\/+$/, ''),
    google: clientId !== null && clientSecret !== null ? { clientId, clientSecret } : null,
    migrationsDir:
      nonEmpty(process.env.MIGRATIONS_DIR) ?? path.resolve(process.cwd(), 'lib/server/db/migrations'),
  };
}

/** Accounts are on only when the database, the public origin and the Google client all exist. */
export function isAuthEnabled(env: ServerEnv = getServerEnv()): boolean {
  return env.databaseUrl !== null && env.appUrl !== null && env.google !== null;
}

/** The narrowed configuration the auth routes work with, or `null` when accounts are off. */
export interface AuthConfig {
  readonly appUrl: string;
  readonly google: GoogleOAuthConfig;
  /** `Secure` cookies whenever the public origin is https (always in production). */
  readonly secureCookies: boolean;
}

export function getAuthConfig(env: ServerEnv = getServerEnv()): AuthConfig | null {
  if (env.databaseUrl === null || env.appUrl === null || env.google === null) return null;
  return { appUrl: env.appUrl, google: env.google, secureCookies: env.appUrl.startsWith('https://') };
}
