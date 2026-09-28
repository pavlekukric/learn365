# Phase 12 — Backend reliability set: honest failure modes for the database, the deploy and the backups (PLAN)

**Status:** Owner-authorized (standing authorization of 2026-09-28 to plan, build and merge the engineering backlog on green CI); built on `feat/phase-12-backend-reliability`.
**Date:** 2026-09-28
**Predecessors:** Phase 11 live (PR #44, `fc72b29`); Phase 10 live (PR #42, `eb7cc97`); Phase 8 live (PR #34, `06e6a55`).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P1 item 11, "Backend reliability set (S each)": _always re-set the session cookie in `GET /api/me`; surface `DbUnavailable` from `getSessionFromToken` so `guardApi` answers 503 instead of 401 and set `connect_timeout: 5` / `statement_timeout` on postgres.js; record the previous tag in `deploy.sh` and roll back when the health wait fails; `depends_on: db: condition: service_started` so reading survives a sick database; `umask 077` + `pg_restore --list` + an off-box copy in `backup.sh`._ Also Operations 5/10: _a failed migration is a crash-loop with no rollback (docs say the opposite), `web` cannot boot while `db` is unhealthy, backups are on-box and never restore-tested._
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: review P1 item 11 — backend reliability set".
- [`docs/DEPLOY.md`](./DEPLOY.md) §2 / §6 / §10 — the scripts and the rules this phase changes.
- [`docs/archive/phases/PHASE_8_PLAN.md`](./archive/phases/PHASE_8_PLAN.md) — the accounts design these fixes sit inside.

## Why this is the next phase

Read from the code on 2026-09-28. Five failure modes, none exercised yet in production, each one line away from a bad evening:

| Failure | Today | After this phase |
| --- | --- | --- |
| A session renewed by a `PATCH /api/me/progress` (any `guardApi` route extends the row when < 15 days remain) | the row lives 30 more days, the **cookie keeps its old expiry** — only `GET /api/me` writes cookies, and only when _its own_ call renewed. The browser drops a valid session. | `GET /api/me` always re-sets the cookie to the row's expiry; a renewal anywhere reaches the browser on the next page load |
| Database down while a signed-in reader saves progress | `getSessionFromToken` swallows the error → `guardApi` answers **401** ("not signed in") | **503** `unavailable` — the sync engine keeps the delta and retries; nothing reads as "signed out" |
| Database slow or hung | postgres.js default `connect_timeout` 30 s, no statement timeout — a request can hang | `connect_timeout: 5`, `statement_timeout` 10 s, `application_name: learn365-web` |
| Database unreachable when `web` boots (VPS reboot, `db` restart) | `depends_on: service_healthy` keeps `web` from starting at all; and if it did start, `instrumentation.ts` throws → crash-loop. **Reading is down because accounts are down.** | `web` starts (`service_started`); start-up migrations treat a **connectivity** error as "accounts off for now" (logged, retried in the background every 15 s for 10 min) and still fail hard on a **failing migration** |
| New image never becomes healthy (bad migration, bad build) | `deploy.sh` prints logs and exits 1 — **the broken container keeps running** | `deploy.sh` remembers the previous tag, rolls back, waits for health again, and keeps the previous image on the box |
| Backups | dumps written with the default umask (world-readable), never verified; on-box only | `umask 077`; every dump is listed with `pg_restore --list` before it counts; the off-box copy stays an owner decision (destination) |

None of this changes what a reader sees. It changes what happens on the bad day.

---

## 1. Locked decisions

### D1 — `GET /api/me` always re-sets the session cookie

`validateSessionToken` keeps returning `renewed` (informational). The route sets the cookie on every successful validation with `validation.session.expiresAt` — idempotent, one `Set-Cookie` per full page load, and the browser's expiry can never lag the row's again.

### D2 — A database outage is a 503, never a 401

`getSessionFromToken` throws `DbUnavailableError` (with `cause`) when the database layer fails; `guardApi` and `DELETE /api/me` catch it and answer `503 { error: 'unavailable' }` (new `apiUnavailable()` in `http.ts`); `getCurrentSession` (server components: `/nalog`, `/prijava`) catches it and treats the reader as signed out — a page must render. postgres.js gets `connect_timeout: 5`, `connection: { application_name: 'learn365-web', statement_timeout: 10_000 }`. The client's sync engine already treats any non-2xx as "keep the delta, retry" and `implicitSignOut` only ever reacts to `GET /api/me` (which answers `enabled: false` on an outage), so a 503 is safe end to end.

### D3 — Reading survives a sick database at boot; a bad migration still fails the deploy

`migrateAtStartup()` (new, used by `instrumentation.ts`) calls `migrateDatabase()`; a **connectivity** error (`isConnectivityError`: `ECONNREFUSED` / `ENOTFOUND` / `ETIMEDOUT` / postgres.js `CONNECT_TIMEOUT` / `CONNECTION_*` / SQLSTATE `57P03`, `53300`, `08xxx`, following `cause` and `AggregateError.errors`) is logged and retried in the background (every 15 s, 40 attempts); the server starts and serves reading, `/api/health` says `db: error`, accounts come back by themselves when the database does. Any other error (a migration that fails to apply) still throws, the container never becomes healthy, and D4 rolls back. `docker-compose.yml`: `web` → `depends_on: db: condition: service_started`. Why not simply tolerate every error: a bad migration would then "deploy" successfully and every account route would 503 until someone noticed.

### D4 — `deploy.sh` rolls back on a failed health wait

Before writing the new `IMAGE_TAG` the script records the previous one; when the 60 s health wait fails it prints the logs, restores the previous tag, `up -d web` again and waits once more, then exits 1 (the workflow shows red either way). The prune step keeps the new, the previous and `latest` images so the next rollback is instant. The Phase 10 gate means a red deploy is now visible in the Deploy run, not silently live.

### D5 — `backup.sh`: private dumps that are verified

`umask 077` before anything is written; after the dump is moved into place, `pg_restore --list` (through `docker exec -i`, stdin) must list at least one entry or the script exits 1 and the log line says so. The off-box copy is deliberately not implemented: it needs a destination the owner has not chosen (Hetzner Storage Box, B2, the laptop…), and each is a different script. Recorded as the open owner decision it already is in HANDOFF.

### D6 — Rollout to the box, learn365 only

`deploy/*` files are not shipped by the workflow (DEPLOY.md §2). After the PR is merged and the image is live through the gate: `scp` the three files to `/srv/learn365/` as `deploy` with the deploy key (the laptop holds `~/.ssh/learn365_deploy`; DEPLOY.md §3b), keep `.bak` copies of the old ones, `dc.sh up -d web` (re-creates `web` with the new `depends_on`, ≈ 20 s like every deploy), verify `/api/health`, and confirm the three `racuni-*` containers unchanged before and after. Nothing else on the box is touched; `.env` permissions belong to the skipped P0 item 1.

### D7 — One PR, three commits

- **12a — Auth + API.** D1, D2 (route, guard, `currentUser`, `http`, `client` options) + tests (`currentUser.test.ts`, `guard.test.ts`).
- **12b — Start-up.** D3 (`migrate.ts`, `instrumentation.ts`, `client.ts` `isConnectivityError`, compose) + `migrate.test.ts`.
- **12c — Ops scripts + docs.** D4, D5, `DEPLOY.md` §2 / §6 / §10, PROJECT_STATE baseline, HANDOFF.

---

## 2. Scope reframe

A failure-mode phase: same product, same API contract, same schema. Not in scope: the P0 secret rotation / `.env` mode (owner-skipped), the off-box backup destination (owner decision), rate limits and security headers (item 20), a restore rehearsal on production (owner, DEPLOY §10), any change to the sync engine or the auth flow.

## 3. Owner actions

None required for the phase. Open decision carried forward: **where the off-box backup copy goes** (then `backup.sh` gets a five-line `rsync`/`rclone` step).

---

## 4. File-level bundle

### 12a — Auth + API
- `apps/web/lib/server/http.ts` — `apiUnavailable()`.
- `apps/web/lib/server/auth/currentUser.ts` — `DbUnavailableError`; `getSessionFromToken` throws it; `getCurrentSession` maps it to `null`.
- `apps/web/lib/server/auth/guard.ts` — catch → `apiUnavailable()`; the existing `getDb()` catch uses the same helper.
- `apps/web/app/api/me/route.ts` — `GET` always sets the cookie; `DELETE` catches `DbUnavailableError` → 503.
- `apps/web/lib/server/db/client.ts` — postgres.js options.
- Tests: `currentUser.test.ts` (unreachable database → `DbUnavailableError`; PGlite + unknown token → `null`; accounts off → `null` without touching the database), `guard.test.ts` (503 on an unreachable database, 401 on no cookie, 404 with accounts off).

Gate: `pnpm --filter @learn365/web test`, typecheck, lint.

### 12b — Start-up
- `apps/web/lib/server/db/client.ts` — `isConnectivityError`.
- `apps/web/lib/server/db/migrate.ts` — `migrateAtStartup(options)` with the background retry; `migrateDatabase` unchanged.
- `apps/web/instrumentation.ts` — calls `migrateAtStartup()`.
- `deploy/docker-compose.yml` — `service_started` + comment.
- Tests: `migrate.test.ts` (`isConnectivityError` table; `migrateAtStartup` resolves `deferred` against `postgres://127.0.0.1:1/learn365` with `retries: 0`; rejects for a PGlite database with a missing migrations folder).

Gate: tests, typecheck, lint, `pnpm build`.

### 12c — Ops scripts + docs
- `deploy/deploy.sh` — previous tag, rollback, prune keeps three tags.
- `deploy/backup.sh` — `umask 077`, `pg_restore --list` check, log line with the entry count.
- `docs/DEPLOY.md` — §2 rows for the three files, §6 (automatic rollback; manual stays), §10 (migrations: connectivity vs. failure; backups: verified, private; off-box still open), §9 row after the rollout.
- `docs/PROJECT_STATE.md` baseline (accounts bullet), `HANDOFF.md`.

Gate: `bash -n` on both scripts; a dry read of the rollback path; docs.

---

## 5. Verification (whole phase)

- Unit: the three new test files green locally and in CI; the existing 79 web tests untouched.
- Build + bundle unchanged (server-only code).
- After the merge and the gated rollout: `/api/health` ok; a signed-in session still works (owner's browser, or a `curl` with a cookie is out of scope); the Deploy run green.
- After D6: `dc.sh ps` shows `web` re-created and healthy, `cloudflared` untouched; `racuni-*` unchanged; `/api/health` ok; `ls -l /srv/learn365/backups` unchanged (the next nightly run at 03:15 exercises D5 — check `backup.log` the day after for `N unosa`).
- Rollback path (D4) is verified by reading, not by breaking production: `bash -n`, and the logic mirrors the existing health wait. A deliberate broken deploy is the owner's call.

## 6. Risks

- **Tolerating connectivity errors at start-up hides a wrong `DATABASE_URL`.** Mitigation: `/api/health` reports `db: error` with 503 and the log line is explicit; the retry loop logs each attempt and gives up loudly after 10 minutes.
- **`statement_timeout` 10 s and migrations.** Ours are milliseconds; a future heavy migration must raise the timeout for its own statement (`SET LOCAL`) — noted in DEPLOY §10.
- **`connection` startup parameters.** postgres.js sends them in the startup packet; `statement_timeout` is a user-settable GUC, accepted at connect. Verified against the 3.4.9 type definitions.
- **Rollback loops on a persistently bad `db`.** If the previous image is also unhealthy (database down for real), the script reports both failures and exits 1; nothing is retried forever.
- **The D6 rollout re-creates `web`** (≈ 20 s, same as every deploy). Done right after a green gated deploy so the image and the compose file agree.

## 7. How to proceed

Branch, 12a → 12b → 12c, PR, merge on green CI, watch the gated deploy, D6 rollout, close out (PROJECT_STATE entry, archive, HANDOFF → item 12).

## 8. Out-of-scope reminders

No auth-flow change, no schema change, no sync-engine change, no Cloudflare or DNS change, no `.env` change on the box, no off-box backup implementation, no restore rehearsal on production.
