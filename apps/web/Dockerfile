# syntax=docker/dockerfile:1
# Learn365 web — Next.js 15 standalone image. Build context is the REPO ROOT
# (.github/workflows/deploy.yml). Workspace packages are transpiled by Next
# (transpilePackages), so only @learn365/ui has a real build step: it emits
# dist/globals.css that the web app's CSS imports.

ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- 1) dependencies ----------
FROM ${NODE_IMAGE} AS deps
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN npm install -g pnpm@9.15.0
WORKDIR /repo
# Manifests only, so this layer stays cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/content/package.json packages/content/
COPY packages/core/package.json packages/core/
COPY packages/ui/package.json packages/ui/
COPY packages/ui-web/package.json packages/ui-web/
COPY tooling/eslint-config/package.json tooling/eslint-config/
COPY tooling/tsconfig/package.json tooling/tsconfig/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- 2) build ----------
FROM deps AS build
# Public origin baked into metadata (og:url, canonical). Empty = Vercel fallback.
ARG NEXT_PUBLIC_SITE_URL=
# Address of the lessons' „Prijavi grešku" mailto. Empty = no link (DEPLOY.md §5).
ARG NEXT_PUBLIC_REPORT_EMAIL=
# NEXT_STANDALONE=1 switches next.config.mjs to output: 'standalone'.
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_REPORT_EMAIL=${NEXT_PUBLIC_REPORT_EMAIL}
ENV NEXT_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm --filter @learn365/ui build \
 && pnpm --filter @learn365/web build

# ---------- 3) runtime ----------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV TZ=Europe/Belgrade
# Drizzle SQL migrations are read from disk at server start (instrumentation.ts),
# so they are copied next to the standalone tree and addressed explicitly.
ENV MIGRATIONS_DIR=/app/apps/web/lib/server/db/migrations
WORKDIR /app
# Standalone tree mirrors the monorepo (outputFileTracingRoot = repo root),
# so the server entry is apps/web/server.js and static/public sit beside it.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /repo/apps/web/lib/server/db/migrations ./apps/web/lib/server/db/migrations
USER node
EXPOSE 3000
# Kept in step with deploy/deploy.sh (HEALTH_WAIT=150): a check every 15 s, failures ignored for the
# first 45 s of a cold start on the 512 MB box, `unhealthy` after 3 misses in a row (~90–105 s at the
# earliest) — Docker's verdict always lands inside the script's wait, never after it.
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "apps/web/server.js"]
