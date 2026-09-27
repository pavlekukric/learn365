# Phase 8 — Nalog i napredak u oblaku: Google prijava + čuvanje napretka (PLAN)

**Status:** Signed off 2026-09-27 ("idemo") and built the same day on `feat/phase-8-accounts`. **Implementation notes:** `arctic` (D2) turned out to be deprecated on npm, so the authorization-code + PKCE flow is written directly against Google's endpoints (`apps/web/lib/server/auth/google.ts`, ~150 lines, tested against the RFC 7636 vector); the TopBar takes a structured `account` prop instead of a ReactNode slot; the sync layer is one generic engine (`apps/web/lib/sync/syncEngine.ts`) with a progress and a bookmark adapter, and the cloud marker is per store. Everything else shipped as written below. The file moves to `docs/archive/phases/` once the PR merges.
**Date:** 2026-09-27
**Predecessors:** self-hosting on the Hetzner VPS (PRs #31, #32; `docs/DEPLOY.md`), the 2026-09-25 product review groups 1–4 (PR #29), Phase 7.11 bookmarks (the second local store with the same swap seam).
**Owner direction already given (2026-09-26/27, recorded in `HANDOFF.md`):** accounts via Google sign-in, cloud progress, Next.js route handlers + Postgres on the same VPS, the sign-in asked for when a reader marks a **second** lesson done, reading stays public.
**Parent references:**
- [`docs/BACKEND_STRATEGY.md`](./BACKEND_STRATEGY.md) — rewritten on 2026-09-27 to this stack; the old .NET/Azure plan lives in git history only.
- [`docs/DEPLOY.md`](./DEPLOY.md) — the VPS compose project this phase extends (`db` service, `.env` secrets, backups).
- [`docs/APP_ARCHITECTURE.md`](./APP_ARCHITECTURE.md) §6 — `ProgressStorage` / `BookmarkStorage` as the swap seam; this plan keeps the stores and adds a sync layer beside them.
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — Current Baseline (do not regress).

---

## Why this is the next phase

The product review closed the first-time experience; the app is live on its own domain and box. The one thing a returning reader still cannot do is **pick up on a second device**, and the one thing the app cannot survive is a cleared browser: progress lives only in `localStorage`. Both are stated on the product itself ("Napredak se pamti u ovom pregledaču, bez naloga."). This phase gives progress a home without changing how the app reads or feels:

- Reading stays public. No page requires an account.
- The ask comes late and once: after the **second** completed lesson, inline, dismissible.
- The stores the whole UI already consumes (`createProgressStore`, `createBookmarkStore`) stay as they are. A sync layer beside them talks to a small set of route handlers; the database sits in the same compose project as the app.

Blast radius is deliberately shaped so that **with no secrets configured the app is byte-for-byte today's app**: CI, Playwright, the current production image and every commit of this phase all run in that "auth-off" mode. The feature turns on by filling `/srv/learn365/.env`.

---

## 1. Locked decisions

To be confirmed by the owner before code. D1 and D5's core (second completion, reading public) were already decided on 2026-09-26/27; the rest is this plan's proposal.

### D1 — Backend = Next.js route handlers in `apps/web`, Postgres in the `learn365` compose project

No `apps/api`, no .NET, no second deployable. Server code lives under `apps/web/lib/server/**` (guarded with the `server-only` package so it can never be bundled for the browser) and is exposed through `apps/web/app/api/**` route handlers. Postgres 17 runs as a third container (`learn365-db`) next to `web` and `cloudflared`, on the private compose network, with no published port and its own named volume. The Računi app and its SQL Server on the same box are not touched (isolation rule in `DEPLOY.md` §1).

**Why.** One image, one pipeline, one PR surface; the content package is already on the server so lesson ids can be validated without a copy of the data; the box is paid for and has the headroom (`web` 512 MB + `db` 256 MB caps beside Računi's 1.5 GB SQL Server on 4 GB).

### D2 — Auth = Google only, authorization code + PKCE via `arctic`, sessions in our own table, one cookie

- Library: [`arctic`](https://www.npmjs.com/package/arctic) `3.7.0` (OAuth 2.0 client, `Google` provider, `generateState` / `generateCodeVerifier` / `decodeIdToken`). Its type surface is exactly `new Google(clientId, clientSecret, redirectURI)`, `createAuthorizationURL(state, codeVerifier, scopes)`, `validateAuthorizationCode(code, codeVerifier)`, `tokens.idToken()`.
- Scopes `openid email profile`. Identity key is the Google `sub`; we keep `email`, `name`, `picture` for the account page and the TopBar mark. We do **not** store Google access or refresh tokens — nothing on our side ever calls a Google API after sign-in.
- Session: 32 random bytes → base64url token in the cookie; only its SHA-256 is stored (`sessions.id`). 30-day lifetime, sliding (renewed when under 15 days remain). Cookie `l365_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` whenever `APP_URL` is https. No signing secret is needed anywhere, so there is no `AUTH_SECRET` to rotate.
- CSRF: every mutating route (`POST` / `PATCH` / `DELETE`) requires the request `Origin` to equal `APP_URL` in addition to the `Lax` cookie. `return_to` after sign-in is accepted only as a same-origin relative path (`/…`, never `//…`).
- ID token checks on the callback: `iss` ∈ {`https://accounts.google.com`, `accounts.google.com`}, `aud` = our client id, `exp` in the future, `email_verified === true`. (The token arrives straight from Google's token endpoint over TLS; signature verification is not required for this flow and is not done.)

**Why not Auth.js / Better Auth.** Auth.js v5 is still `5.0.0-beta.32` (2026-07-20) with opaque JWE cookies and a callback surface far wider than one provider needs. Better Auth (1.7.6) is actively maintained but dictates four tables including stored provider tokens we do not want. One provider, two tables, ~250 lines we can read end to end is the smaller risk here. If the owner prefers a library regardless, Auth.js v5 with the JWT session strategy is the fallback and the rest of this plan is unchanged.

### D3 — Data = Drizzle ORM + `postgres` (postgres.js) in production, PGlite locally, SQL migrations applied at server start

- `drizzle-orm` `0.45.x` + `drizzle-kit` (dev) generate SQL migration files into `apps/web/lib/server/db/migrations/` which are committed. Migrations run once from `apps/web/instrumentation.ts` (`register()`, `NEXT_RUNTIME === 'nodejs'`, only when `DATABASE_URL` is set); Next awaits it before serving, so a failed migration fails the container's healthcheck and `deploy.sh` reports it. Single replica, so no lock contention.
- Driver chosen by URL scheme: `postgres://…` → postgres.js (pool max 5); `pglite://<dir>` → `@electric-sql/pglite` via `drizzle-orm/pglite`. PGlite exists because the owner's laptop has neither Docker nor a local Postgres (checked 2026-09-27) and because it lets the repository layer be tested against real SQL in Vitest with zero services. It is excluded from the production image (`serverExternalPackages` + `outputFileTracingExcludes`).
- The Dockerfile copies the migrations folder into the runtime stage and sets `MIGRATIONS_DIR`; nothing else in the image pipeline changes.

Schema (all ids are the stable content strings, no surrogate ints — `BACKEND_STRATEGY.md` §11):

```
users               id uuid pk default gen_random_uuid()
                    google_sub text unique not null
                    email text not null, name text, picture_url text
                    created_at timestamptz default now(), last_seen_at timestamptz
sessions            id text pk  (sha256 of the cookie token)
                    user_id uuid fk → users on delete cascade
                    expires_at timestamptz not null, created_at timestamptz default now()
                    index (user_id), index (expires_at)
course_progress     user_id fk cascade, course_id text, last_opened_lesson_id text null,
                    updated_at timestamptz not null            pk (user_id, course_id)
lesson_completions  user_id fk cascade, course_id text, lesson_id text,
                    completed_at timestamptz default now()     pk (user_id, course_id, lesson_id)
bookmarks           user_id fk cascade, course_id text, lesson_id text,
                    created_at timestamptz default now()       pk (user_id, course_id, lesson_id)
```

Expired sessions are purged opportunistically on every sign-in. Account deletion is one `DELETE FROM users` — everything cascades.

### D4 — Sync model: local store renders, server is the truth across devices

The Zustand stores and their `localStorage` persistence are untouched. Two things are added beside them:

1. **One additive action per store** in `@learn365/core`: `replaceCourseProgress(courseId, snapshot)` and `replaceCourseBookmarks(courseId, snapshot)` — apply a server snapshot wholesale. Plus pure, unit-tested `mergeCourseProgress(local, remote)` (union of completions, `lastOpenedLessonId` from the later `updatedAt`) and `mergeCourseBookmarks`.
2. **A client sync component per store** (`apps/web/lib/sync/ProgressSync.tsx`, `BookmarkSync.tsx`), mounted inside the providers and active only while a user is signed in:
   - **First time this browser sees this user** (marker `learn365:cloud:v1 = { userId }` absent or different): `POST /api/me/progress/sync` with the local snapshot → the server unions it into the account and returns the canonical state → `replaceCourseProgress`. This is how anonymous progress migrates on first sign-in, and it runs once per (browser, user).
   - **Every later page load:** `GET /api/me/progress?courseId=…` → replace local with the server state. The server is authoritative, so an un-completion made on another device propagates.
   - **Every local change:** the component subscribes to the store, diffs the previous and next `completedLessonIds` / `lastOpenedLessonId`, coalesces for 250 ms and sends `PATCH /api/me/progress { courseId, complete: [], uncomplete: [], lastOpenedLessonId? }` with `keepalive: true`. One retry after 2 s; still-failed deltas wait in memory for the next change or the `online` event. Snapshot application is wrapped so it never echoes back as a delta.
   - **Known v1 limitation, stated:** edits made while offline and not retried before the tab closes are lost at the next load (no persistent outbox). The app has no offline mode today, so this is not a regression.

Sign-out (`POST /api/auth/signout`) clears the session server-side, then the client clears **both local stores and the cloud marker** and returns Home. The next person on this browser starts clean; the reader's data lives in the account.

### D5 — Product surface

1. **Reading stays public.** No route requires sign-in. Home, course, lesson, About are unchanged in structure.
2. **The ask after the second completion.** `LessonReader` gains an optional `signInPrompt` prop rendered inside the completed footer, between the moment and the next-lesson card. Shown when `completedCount ≥ 2 && no user && auth enabled && not dismissed`. A paper card in the existing register: eyebrow `NALOG`, serif line `Sačuvaj napredak i na drugim uređajima.`, one body line `Prijava Google nalogom. Ono što si ovde pročitao prenosi se na nalog.`, primary pill `Nastavi sa Google-om` (a plain link to `/api/auth/google?return_to=<this lesson>`), ghost `Ne sada`. `Ne sada` writes `learn365:signin-prompt:v1 = { dismissedAt }` and the card never auto-appears again; the TopBar entry stays. The first-win moment on completion 1 is untouched. Not a modal, nothing blocks reading.
3. **TopBar account slot.** `TopBar` gains an optional `account?: ReactNode` slot after the progress capsule; `TopBarHost` fills it. Signed-out: text link `Prijava` (desktop), a 24px person icon with `aria-label="Prijava"` ≤720px. Signed-in: a 26px round mark (Google picture, initials fallback) linking to `/nalog`. No dropdown menu — the account page carries the actions, which keeps the masthead calm and avoids a new menu primitive. Auth-off: the slot renders nothing.
4. **`/prijava`.** Editorial page: eyebrow `Nalog`, title `Prijava`, a lede that says what the account is for (progress and saved lessons on every device — and nothing else), one button `Nastavi sa Google-om`, a quiet line linking `/privatnost`. `?greska=odbijeno|neuspesno` renders a calm error line. Already signed in → redirect to `/nalog`. Auth-off → the page says sign-in is not available yet.
5. **`/nalog`.** Name, email, `Napredak se čuva na tvom nalogu.`, `Odjava` button, and `Obriši nalog` with a two-step inline confirm (`Ovo briše nalog i sav napredak. Sigurno?` → `Obriši` / `Odustani`). Signed out → redirect to `/prijava`.
6. **`/privatnost`.** Serbian, short, honest: what is stored (Google id, email, name, picture; completed lessons, last opened lesson, bookmarks), why, where (Hetzner, Helsinki, EU), how long (until the account is deleted), how to delete (`/nalog`), the single session cookie, no analytics, contact. Linked from the Footer (`Privatnost`), from `/prijava`, and required by Google's consent screen.
7. **Copy.** `howItWorks` step 2 becomes `Jedan klik na kraju teksta. Napredak se pamti u ovom pregledaču; prijavom Google nalogom prenosi se i na druge uređaje.` (Home + About share the source). Footer gains `Privatnost`.
8. **Session delivery to the client.** Pages stay static. A client `AuthProvider` fetches `GET /api/me` once per full load (`{ enabled, user }`) — the same pattern as progress hydration today (TopBar count already goes 0 → N after mount). The slot reserves its width so nothing shifts; the mark fades in. If the request fails (database down), the client behaves as signed-out for that load and touches nothing local.

### D6 — Auth-off is the default and the safety net

`authEnabled = DATABASE_URL && APP_URL && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET`, evaluated at request time on the server. Without it: `/api/me` → `{ enabled: false, user: null }`, `/api/auth/*` and `/api/me/*` → 404, `/prijava` / `/nalog` → the unavailable state, no prompt, no TopBar slot. CI, Playwright (`next start` with no env), Vercel-less builds and the production image until `.env` is filled all run in this mode. **Reading never depends on the database**: the image healthcheck stays `GET /`; `GET /api/health` additionally reports `db: ok | off | error`.

### D7 — Deploy changes (all inside `/srv/learn365`, Računi untouched)

- `deploy/docker-compose.yml`: new `db` service — `postgres:17-alpine`, `container_name: learn365-db`, `mem_limit: 256m`, `command: postgres -c shared_buffers=32MB -c max_connections=20`, env from `.env` (`POSTGRES_DB=learn365`, `POSTGRES_USER=learn365`, `POSTGRES_PASSWORD`), volume `learn365-pgdata`, healthcheck `pg_isready`. `web` gets `env_file: .env` and `depends_on: db: condition: service_healthy`. No port published.
- `deploy/.env.example`: `IMAGE_TAG`, `POSTGRES_PASSWORD`, `DATABASE_URL=postgres://learn365:<pw>@db:5432/learn365`, `APP_URL=https://istorija365.com`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- `deploy/backup.sh` + one cron line for user `deploy` (`15 03 * * *`): `pg_dump -Fc` via `docker exec learn365-db` into `/srv/learn365/backups/`, keep 14 days. Off-box copy is a follow-up (owner decision on destination).
- `deploy.sh` unchanged (`up -d web` brings `db` up through `depends_on`). `DEPLOY.md` gains the env table, the database/backup/restore section and the owner steps from §3.

### D8 — Local development

`apps/web/.env.example` → `.env.local`: `DATABASE_URL=pglite://.data/dev`, `APP_URL=http://localhost:3000`, plus a dev OAuth client (`http://localhost:3000/api/auth/google/callback`). `.data/` is git-ignored. `pnpm dev` then runs the complete flow on the laptop with nothing installed. Without `.env.local`, `pnpm dev` is today's app.

### D9 — Tests

- `@learn365/core`: `mergeCourseProgress`, `mergeCourseBookmarks`, the two `replace*` actions (Vitest, pure).
- `apps/web/lib/server/**/*.test.ts`: repository layer against in-memory PGlite with the real migrations — session create/validate/expiry/sliding renewal, Google upsert idempotency, progress delta + sync union + unknown-id filtering, bookmarks, cascade on user delete, `return_to` sanitiser, Origin check. Runs in `pnpm test` today's config (`environment: node`).
- `@learn365/ui-web`: `SignInPrompt`, `AccountMark`, TopBar slot render tests.
- Playwright: every existing spec unchanged (auth-off). New `e2e/auth-off.spec.ts`: no account slot in the TopBar, no prompt after two completions, `/prijava` shows the unavailable state, `/privatnost` renders.
- **Authenticated flow is manual QA on production** (§6). No test-only auth bypass is added to the app.

### D10 — Shipping shape

One PR, four code commits + one docs commit, each mergeable on its own because every one of them leaves auth-off behaviour identical:

1. `feat(db)` — compose `db`, Drizzle schema + first migration, driver switch, `instrumentation.ts`, `/api/health`, PGlite tests, Dockerfile copy of migrations, `DEPLOY.md` env table.
2. `feat(auth)` — arctic Google flow, sessions, `/api/me` (GET/DELETE), `/prijava`, `/nalog`, `/privatnost`, `AuthProvider`, TopBar slot + `AccountMark`, Footer link, copy change.
3. `feat(sync)` — core merge helpers + `replaceCourseProgress`, `/api/me/progress` (GET/PATCH) + `/sync`, `ProgressSync`, `SignInPrompt` after the second completion, sign-out clearing local state.
4. `feat(sync)` — bookmarks: `replaceCourseBookmarks`, `/api/me/bookmarks` (+ `/sync`), `BookmarkSync`.
5. `docs` — `PROJECT_STATE.md` phase entry + baseline lines, `HANDOFF.md`, plan moved to `docs/archive/phases/`.

Merge → auto-deploy (dark) → owner does §3 → live. Nothing in production changes for readers until `.env` is filled.

---

## 2. Scope reframe — what this phase is, and what it is not

**Is:** an account that exists only to hold progress; Google as the single door; the same progress model as today, now durable and shared between devices; the ask placed where the reader has just proven the habit (second completion).

**Is not:** email/password or magic links; Apple / other providers; streaks, reminders, notifications; a profile or anything social; an offline outbox or cross-tab live sync; analytics; an admin view of users; native mobile; multi-course UI (the schema is per course already, the UI is not). Payments remain a v1 exclusion.

---

## 3. Owner actions (browser and VPS, ~30 min total; needed for go-live, not for coding)

**A. Google Cloud (~15 min), after commit 2 is deployed so `/privatnost` resolves.**
1. New project (e.g. `istorija365`) — not Računi's project (isolation rule).
2. *OAuth consent screen / Branding*: External; app name `Istorija 365`; support email; homepage `https://istorija365.com`; privacy policy `https://istorija365.com/privatnost`; authorized domain `istorija365.com`; developer contact. If Google asks to verify the domain, add the Search Console TXT record in the Cloudflare zone for `istorija365.com` (not `kucniracuni.com` — see the wrong-zone pitfall in `DEPLOY.md` §3b).
3. *Data access / scopes*: `openid`, `…/auth/userinfo.email`, `…/auth/userinfo.profile` (non-sensitive: no verification review).
4. *Publishing status*: **In production**. In "Testing" only listed test users can sign in.
5. *Credentials → OAuth client, Web application*: authorized JavaScript origin `https://istorija365.com`; redirect URI `https://istorija365.com/api/auth/google/callback`. Copy the client id + secret.
6. Optional second client for the laptop: origin `http://localhost:3000`, redirect `http://localhost:3000/api/auth/google/callback`.

**B. Cloudflare (~2 min).** A redirect rule `www.istorija365.com/*` → `https://istorija365.com/$1` (301) so the session cookie and the OAuth origin live on one host. Today both hostnames serve the app; after this, `www` only forwards.

**C. VPS (~10 min), from the laptop, keeping SSH bursts under 5 (ufw limit).**
1. `scp deploy/docker-compose.yml deploy/backup.sh deploy@<IP>:/srv/learn365/`
2. Fill `/srv/learn365/.env` (see D7; generate `POSTGRES_PASSWORD` with `openssl rand -base64 24`).
3. `ssh deploy@<IP> '/srv/learn365/dc.sh up -d db && /srv/learn365/dc.sh up -d web'` — web restarts with the env, migrations run on start.
4. `curl -s https://istorija365.com/api/health` → `{"ok":true,"auth":true,"db":"ok"}`.
5. `crontab -e` as `deploy`: `15 3 * * * /srv/learn365/backup.sh`.
6. The usual check: the three `racuni-*` containers unchanged, `https://kucniracuni.com/api/health` still `302`.

---

## 4. File-level bundle

### 8a — Database (commit 1)

| Area | Files |
|---|---|
| Schema + client | `apps/web/lib/server/db/schema.ts`, `client.ts` (driver by scheme, singleton), `migrate.ts`, `migrations/0000_init.sql` + `meta/`, `apps/web/drizzle.config.ts` |
| Startup | `apps/web/instrumentation.ts` |
| Env | `apps/web/lib/server/env.ts` (`server-only`; reads once; `authEnabled()`), `apps/web/.env.example`, `.gitignore` (`.data/`, `.env.local` already) |
| Health | `apps/web/app/api/health/route.ts` |
| Next config | `next.config.mjs`: `serverExternalPackages: ['@electric-sql/pglite']`, `outputFileTracingExcludes` for it |
| Image | `apps/web/Dockerfile`: copy `lib/server/db/migrations`, `ENV MIGRATIONS_DIR` |
| Deploy | `deploy/docker-compose.yml` (`db`), `deploy/.env.example`, `deploy/backup.sh`, `docs/DEPLOY.md` §5 + new §10 |
| Deps | `drizzle-orm`, `postgres`, `server-only`; dev: `drizzle-kit`, `@electric-sql/pglite` |
| Tests | `apps/web/lib/server/db/client.test.ts` (migrate on PGlite, `select 1`) |

### 8b — Google sign-in (commit 2)

| Area | Files |
|---|---|
| Auth core | `apps/web/lib/server/auth/google.ts`, `session.ts`, `users.ts`, `currentUser.ts`, `csrf.ts`, `returnTo.ts` |
| Routes | `app/api/auth/google/route.ts`, `app/api/auth/google/callback/route.ts`, `app/api/auth/signout/route.ts`, `app/api/me/route.ts` (GET, DELETE) |
| Pages | `app/prijava/page.tsx` + `.module.css`, `app/nalog/page.tsx` + `NalogActions.tsx` (client), `app/privatnost/page.tsx` + `_copy.ts` |
| Client state | `apps/web/lib/auth/AuthProvider.tsx` (`useAuth()` → `{ enabled, user, status, signOut, deleteAccount }`), `app/providers.tsx` |
| UI (ui-web) | `primitives/TopBar` (`account` slot), `primitives/AccountMark` (new), `icons/IconUser` (new), `primitives/Footer` (`privacyHref`) |
| Web wiring | `components/top-bar/TopBarHost.tsx`, `app/layout.tsx` (Footer href), `lib/copy/howItWorks.ts` |
| Next config | `images.remotePatterns` for `lh3.googleusercontent.com` |
| Deps | `arctic` |
| Tests | `lib/server/auth/session.test.ts`, `users.test.ts`, `returnTo.test.ts`, `csrf.test.ts`; ui-web `AccountMark.test.tsx`, TopBar slot test; e2e `auth-off.spec.ts` |

### 8c — Progress sync + the ask (commit 3)

| Area | Files |
|---|---|
| Core | `packages/core/src/progress/merge.ts` (+ test), `store.ts` (`replaceCourseProgress` + test), `types.ts`, `index.ts` |
| Server | `lib/server/progress/repository.ts`, `validation.ts`; `app/api/me/progress/route.ts` (GET, PATCH), `app/api/me/progress/sync/route.ts` (POST) |
| Client | `lib/sync/ProgressSync.tsx`, `lib/sync/cloudMarker.ts`, `lib/auth/useSignInPrompt.ts`, `app/providers.tsx` |
| UI (ui-web) | `lesson/SignInPrompt` (new), `lesson/LessonReader` (`signInPrompt?` prop rendered inside the completed footer), `lesson/CompletedFooter` (slot) |
| Web wiring | `app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` |
| Tests | `lib/server/progress/repository.test.ts` (delta, sync union, unknown ids dropped, cascade); ui-web `SignInPrompt.test.tsx`; e2e `auth-off.spec.ts` (no prompt after two completions) |

### 8d — Bookmarks sync (commit 4)

Mirror of 8c: `packages/core/src/bookmarks/merge.ts` + `replaceCourseBookmarks`; `lib/server/bookmarks/repository.ts`; `app/api/me/bookmarks/route.ts` + `sync/route.ts`; `lib/sync/BookmarkSync.tsx`; tests.

### 8e — Docs (commit 5)

`docs/PROJECT_STATE.md` (baseline: "Progress storage", "Explicitly deferred", technical stack; new "Phase 8 — done" entry), `HANDOFF.md`, `docs/DEPLOY.md` status table, move this file to `docs/archive/phases/`.

---

## 5. API contract (all JSON, all under `/api`, all dynamic)

| Method | Path | Auth | Body → Response |
|---|---|---|---|
| `GET` | `/api/health` | – | → `{ ok, auth: boolean, db: 'ok' \| 'off' \| 'error' }` (503 on `error`) |
| `GET` | `/api/auth/google?return_to=/…` | – | 302 to Google; sets `l365_oauth` (state, verifier, return_to; 10 min) |
| `GET` | `/api/auth/google/callback?code&state` | – | 302 to `return_to` (default `/`); errors → `/prijava?greska=odbijeno\|neuspesno` |
| `POST` | `/api/auth/signout` | cookie + Origin | → 204, cookie cleared |
| `GET` | `/api/me` | cookie | → `{ enabled: true, user: { id, name, email, picture } \| null }` or `{ enabled: false, user: null }` |
| `DELETE` | `/api/me` | cookie + Origin | → 204; user + all rows deleted, cookie cleared |
| `GET` | `/api/me/progress?courseId` | cookie | → `{ courseId, completedLessonIds: string[], lastOpenedLessonId: string \| null, updatedAt }` (empty shape when none) |
| `PATCH` | `/api/me/progress` | cookie + Origin | `{ courseId, complete?: string[], uncomplete?: string[], lastOpenedLessonId?: string \| null }` → 204 |
| `POST` | `/api/me/progress/sync` | cookie + Origin | local snapshot → canonical merged snapshot (same shape as GET) |
| `GET` | `/api/me/bookmarks?courseId` | cookie | → `{ courseId, lessonIds: string[], updatedAt }` |
| `PATCH` | `/api/me/bookmarks` | cookie + Origin | `{ courseId, add?: string[], remove?: string[] }` → 204 |
| `POST` | `/api/me/bookmarks/sync` | cookie + Origin | local snapshot → canonical |

Rules: 401 without a valid session; 404 for every route except `/api/health` and `/api/me` when auth is off; 403 on a failed Origin check; bodies capped at 64 KB and 400 ids per list; `courseId` must exist in `@learn365/content`; unknown lesson ids are dropped (counted in the log, never fail the request) so a stale local cache can never lock a reader out of sync. No PII in logs (user id only).

---

## 6. Verification

**Automated gates (every commit):** `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm validate-content`; Playwright Chromium desktop + mobile (all existing specs + `auth-off.spec.ts`); the deploy workflow's build-only job (Dockerfile changes trigger it).

**Manual QA on production after §3 (owner + operator), in this order:**
1. `/api/health` reports `db: ok`; `/privatnost` and `/prijava` render; TopBar shows `Prijava`.
2. Fresh browser: complete Day 1 (first-win moment unchanged, no prompt), complete Day 2 → the ask appears under the moment; `Ne sada` hides it for good on this browser; TopBar `Prijava` remains.
3. Sign in from the prompt → Google → back on the same lesson; mark shows in the TopBar; `/nalog` shows name + email; the two local completions are on the account (`GET /api/me/progress` via devtools).
4. Second device / private window, sign in → both completions present; complete Day 3 there → first device reloads and shows 3.
5. Un-complete Day 3 on device 2 → device 1 reload shows 2 (server authoritative).
6. Bookmark a lesson on one device → appears in `Sačuvane lekcije` on the other.
7. `Odjava` → local progress and bookmarks are gone on that browser, TopBar back to `Prijava`, reading still works.
8. Sign in again → progress returns from the account.
9. `Obriši nalog` → confirm → home, signed out; signing in again starts an empty account.
10. Stop `learn365-db` for a minute: reading works, `/api/health` says `error`, TopBar shows signed-out, nothing local is cleared; start it again → back to normal on reload.
11. `free -h` on the box after a day; the three `racuni-*` containers and `kucniracuni.com/api/health` unchanged; `/srv/learn365/backups/` has a dump after the first night; `pg_restore --list` on it succeeds.

---

## 7. Security checklist (reviewed before merge of 8b)

- [ ] `state` cookie compared on callback; `code_verifier` never leaves the cookie; both cookies `HttpOnly`, 10-minute `Max-Age`, deleted after use.
- [ ] ID token `iss` / `aud` / `exp` / `email_verified` checked; `sub` is the only identity key.
- [ ] Session token 256-bit random; only the SHA-256 stored; constant-time comparison not needed (lookup by hash); cookie `HttpOnly` + `SameSite=Lax` + `Secure` (https) + `Path=/`.
- [ ] `Origin` check on every `POST` / `PATCH` / `DELETE`; `return_to` sanitised to a same-origin path.
- [ ] No Google tokens stored; no PII in logs; payload caps; lesson ids validated against content.
- [ ] `server-only` on every module under `lib/server/`; secrets only in `/srv/learn365/.env` (never in the image, never in the repo).
- [ ] `db` has no published port; `web` reaches it only through the compose network.
- [ ] Account deletion cascades everything; `/privatnost` describes exactly what is stored.

---

## 8. Risks

- **Own OAuth/session code.** Mitigated by the checklist above, PGlite-backed tests on the session layer, and the manual flow on both local and production clients. Fallback: Auth.js v5 JWT sessions behind the same `/api/me` contract.
- **Postgres beside SQL Server on 4 GB.** `mem_limit 256m`, `shared_buffers 32MB`, `max_connections 20`, pool max 5. Verified with `free -h` after the first day; Računi's cap is untouched.
- **Migration at startup.** A bad migration makes `web` unhealthy → `deploy.sh` exits 1 with logs; rollback is the previous tag (migrations are additive only in this phase, so the old image runs against the new schema).
- **Offline edits while signed in** can be lost (D4). Stated as a v1 limitation; a persistent outbox is a small follow-up if it ever matters.
- **First paint shows the signed-out slot** for the ~100 ms `/api/me` takes on a warm box. Width reserved; mark fades in; same class of hydration delay as the progress count today.
- **Google publishing status.** In "Testing" only test users can sign in and the consent screen warns. Owner publishes to production (§3.A.4); no review for these scopes.
- **Backups are on the same box.** Nightly dumps protect against bad deploys, not against losing the VPS. Off-box copy is a follow-up with an owner decision on destination.
- **Privacy text is not lawyer-reviewed.** EU hosting, deletion built in, minimal data; the page says exactly that.

---

## 9. How to proceed

1. Owner reads §1 and answers: D2 (arctic vs. a library), D3 (PGlite for the laptop), D5.3 (no dropdown — account page carries actions), D5.6/§3.B (privacy page + `www` redirect), D7 (nightly local backups). Everything else is implementation detail.
2. On sign-off: branch `feat/phase-8-accounts`, commits 8a → 8d in order, gates per commit, PR with the auth-off Playwright run green.
3. Merge → dark deploy → owner does §3.A–C → manual QA §6 → `docs` commit 8e and archive this plan.

---

## 10. Out-of-scope reminders

- Do not add a test-only auth bypass, an email/password path, or a second provider.
- Do not make any reading route depend on the database or the session.
- Do not change the Zustand stores' persistence, keys or shapes; sync sits beside them.
- Do not touch `/srv/racuni`, Računi's containers, ufw, sshd, Docker daemon or global prune — ever.
