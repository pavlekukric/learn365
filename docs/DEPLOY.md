# Deploy

Canonical deploy procedure for Learn365 web. **Target since 2026-09-26: the owner's Hetzner VPS**, shared with the Računi app, behind a Cloudflare Tunnel. The former Vercel project (`learn365-web`) was deleted on 2026-09-28 (§8); `learn365-web.vercel.app` answers 404.

Phase 8 (accounts + cloud progress) lives in this same compose project: a `db` service and four runtime secrets in `.env` — §5, §10 and [archive/phases/PHASE_8_PLAN.md](archive/phases/PHASE_8_PLAN.md). Without those secrets the app runs exactly as before (no accounts), so every deploy is safe to roll out dark.

---

## 1. Target and rationale

| | |
|---|---|
| Host | Hetzner Cloud `pavleserver` — CX23 (2 vCPU, 4 GB, 40 GB), Helsinki, Ubuntu 24.04. Already runs Računi (SQL Server Express capped at 1.5 GB + .NET app + cloudflared). |
| Runtime | Docker Compose project `learn365` in `/srv/learn365`: `web` (Next.js standalone image from GHCR, `mem_limit` 512 MB) + `db` (Postgres 17 alpine, `mem_limit` 256 MB, named volume `learn365-pgdata`, no published port — Phase 8) + `cloudflared` (tunnel `learn365`). |
| Ingress | Cloudflare Tunnel only. **No port is published**; ufw allows SSH only. Cloudflare terminates TLS, absorbs DDoS and caches `/_next/static`. The hostname carries **no Cloudflare Access policy** — the site is public. |
| Image | Built by GitHub Actions ([.github/workflows/deploy.yml](../.github/workflows/deploy.yml)) from [apps/web/Dockerfile](../apps/web/Dockerfile), pushed to `ghcr.io/pavlekukric/learn365-web` as `sha-<12>` + `latest`. **Never built on the VPS** (2 vCPU, RAM shared with SQL Server). |
| Rollout | The workflow ssh-es in as user `deploy` and runs `/srv/learn365/deploy.sh <tag>`: writes `IMAGE_TAG` to `.env`, `compose pull`, `compose up -d web`, waits for the image healthcheck, prunes older `learn365-web` tags only. |

Why (owner decision, 2026-09-26): the box is already paid for, no vendor lock, and the account/progress phase wants a database next to the app. Given up vs. Vercel: per-PR preview URLs and the edge network (Cloudflare's cache covers the static half). Single-box caveat: unattended-upgrades may reboot at 04:30 (Računi's setting); containers are `restart: unless-stopped`.

### Isolation rule — Računi is never touched

Hard rule from the owner. Everything Learn365 owns is separate: `/srv/learn365`, compose project + network `learn365`, tunnel `learn365` with its own credentials, its own `.env`, its own Google Cloud project (auth phase), its own cron line (backup phase). Nothing under `/srv/racuni` is read or written; no `racuni` compose command is run; no global `docker system prune`; ufw, sshd, the Docker daemon and Računi's cron stay as they are. Every server step ends with a check that the three `racuni-*` containers are unchanged and `https://kucniracuni.com/api/health` still answers `302` to Cloudflare Access.

---

## 2. Moving parts in the repo

| File | Role |
|---|---|
| `apps/web/next.config.mjs` | `output: 'standalone'` **only when `NEXT_STANDALONE=1`** (the Dockerfile sets it). Opt-in because the tracing step recreates pnpm symlinks, which Windows refuses without Developer Mode; a plain `pnpm build` on a dev machine is unchanged. `outputFileTracingRoot` = monorepo root so workspace packages are traced. |
| `apps/web/lib/seo/metadata.ts` | `SITE_URL` = `NEXT_PUBLIC_SITE_URL` at build time, production origin (`https://istorija365.com`) as fallback. Feeds `metadataBase`, canonical URLs, Open Graph, `sitemap.xml` and `robots.txt`. |
| `apps/web/Dockerfile` | 3 stages: deps (manifests only, pnpm 9.15 via npm, store cache) → build (`@learn365/ui` emits `dist/globals.css`, then `next build`) → runtime (`node:22-bookworm-slim`, non-root `node`, `HEALTHCHECK` = `GET /`). Context is the **repo root**; `.dockerignore` trims it. |
| `.github/workflows/ci.yml` | Two parallel jobs on every PR and push to `main` (Phase 10): `validate` = install → validate-content → generated-content drift check (`pnpm gen-content` + `git diff`) → lint → typecheck → test → build → bundle budget; `e2e` = Playwright on Chromium desktop + mobile against `next start`, accounts off. |
| `.github/workflows/deploy.yml` | PR touching deploy files → build only. Green CI for a push to `main` (`workflow_run`, Phase 10) / manual → build, push to GHCR, ssh rollout; the commit built is the one CI validated (`workflow_run.head_sha`). Rollout is a no-op until `DEPLOY_HOST` / `DEPLOY_SSH_KEY` exist. |
| `deploy/docker-compose.yml` | `db` + `web` + `cloudflared`. Copied to `/srv/learn365/docker-compose.yml`. Secrets reach containers only through explicit `environment:` mappings interpolated from `.env` (no `env_file`). `web` depends on `db` with `service_started` (Phase 12): reading needs no database, so `web` boots even while `db` is still coming up or sick. |
| `deploy/cloudflared/config.yml` | Tunnel ingress template (`<TUNNEL_ID>`, `<DOMEN>` placeholders). Copied to `/srv/learn365/cloudflared/config.yml`; the credentials JSON is never in the repo. |
| `deploy/dc.sh` | `docker compose` wrapper pinned to `/srv/learn365` + its `.env`. |
| `deploy/deploy.sh` | The rollout script the workflow calls (see §1). Phase 12: remembers the previous `IMAGE_TAG`, and when the new image does not become healthy within ~60 s it restores the previous tag, brings `web` up again and waits once more before exiting 1; the prune keeps the new, the previous and `latest` images. |
| `deploy/vps-install.sh` | One-time root script: user `deploy` (docker group, key-only, no forwarding) + `/srv/learn365` folders. Does nothing else. |
| `deploy/.env.example` | `IMAGE_TAG` + the Phase 8 runtime values: `POSTGRES_PASSWORD`, `DATABASE_URL`, `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. |
| `deploy/backup.sh` | Nightly `pg_dump -Fc` of the `db` container into `/srv/learn365/backups/`, 14-day retention. One cron line for user `deploy` (§10). Phase 12: `umask 077` (dumps readable by `deploy` only) and every dump is checked with `pg_restore --list` before it counts (the log line carries the entry count; an empty list exits 1). |
| `.gitattributes` | `*.sh`, `Dockerfile`, `deploy/**` forced to LF so files scp-ed from Windows run on Linux. |
| `.nvmrc` | Bumped 20 → 22 (Node 20 is end-of-life since 2026-04); CI and the image agree. |

Files under `deploy/` are **not** shipped by the workflow. When one changes, scp it to `/srv/learn365/` (as root or `deploy`) and, for compose changes, run `./dc.sh up -d`.

---

## 3. One-time setup

### 3a. Owner, in a browser (~20 min total)

1. **Domain** — buy at Cloudflare Registrar (same account as `kucniracuni.com`); the zone appears automatically. Decide apex vs. `www` (both are routed).
2. **`gh auth login`** once on the laptop, so secrets/variables can be set from the CLI.
3. **`cloudflared tunnel login`** once, choosing the new zone in the browser (writes a fresh `cert.pem` for that zone).
4. **GHCR package visibility** — after the first image push: GitHub → Packages → `learn365-web` → Package settings → *Change visibility* → Public. The VPS then pulls without a token (the image contains no secrets; the site is public anyway).

### 3b. Operator, from the laptop (each step reversible; Računi untouched)

```
# 1. dedicated deploy key (never root's key in GitHub)
ssh-keygen -t ed25519 -N "" -C learn365-deploy -f ~/.ssh/learn365_deploy

# 2. server: user + folders
scp deploy/vps-install.sh ~/.ssh/learn365_deploy.pub root@<IP>:/root/
ssh root@<IP> 'bash /root/vps-install.sh'

# 3. server: compose + scripts
scp deploy/docker-compose.yml deploy/dc.sh deploy/deploy.sh deploy@<IP>:/srv/learn365/
ssh deploy@<IP> 'chmod +x /srv/learn365/*.sh'

# 4. tunnel (laptop) + its files (server, root because the folder is owned by uid 65532)
#    WARNING: ~/.cloudflared/config.yml and cert.pem on the laptop belong to Računi (tunnel `racuni`, zone
#    kucniracuni.com). A bare `cloudflared tunnel route dns` writes into THAT zone and points at THAT tunnel —
#    it happened on 2026-09-26 and the two stray CNAMEs had to be deleted by hand. Rules: always pass --config
#    with a learn365-only file (two lines: `tunnel: <TUNNEL_ID>` and `credentials-file: <path to the json>`),
#    and create the CNAMEs in the dashboard (zone <DOMEN>: `@` and `www` -> <TUNNEL_ID>.cfargotunnel.com,
#    proxied) instead of `route dns`, unless cert.pem was re-issued for <DOMEN> via `cloudflared tunnel login`.
cloudflared --config learn365-cloudflared.yml tunnel create learn365   # prints <TUNNEL_ID>, writes ~/.cloudflared/<TUNNEL_ID>.json
sed "s/<TUNNEL_ID>/<id>/g; s/<DOMEN>/<domen>/g" deploy/cloudflared/config.yml > /tmp/config.yml
scp /tmp/config.yml ~/.cloudflared/<TUNNEL_ID>.json root@<IP>:/srv/learn365/cloudflared/
ssh root@<IP> 'chown 65532:65532 /srv/learn365/cloudflared/*; chmod 600 /srv/learn365/cloudflared/*.json; chmod 644 /srv/learn365/cloudflared/config.yml'

# 5. GitHub: secrets + build-time site URL
gh secret set DEPLOY_HOST --body <IP>
gh secret set DEPLOY_USER --body deploy
gh secret set DEPLOY_SSH_KEY < ~/.ssh/learn365_deploy
gh variable set DEPLOY_HOST_KEY --body "$(ssh-keyscan -t ed25519 <IP> 2>/dev/null)"   # pinned host key, one line
gh variable set SITE_URL --body https://<DOMEN>

# 6. first rollout: merge to main (or `gh workflow run deploy.yml`), then start the tunnel
ssh deploy@<IP> '/srv/learn365/dc.sh up -d cloudflared && /srv/learn365/dc.sh ps'
curl -sI https://<DOMEN>/ | head -1                      # HTTP/2 200
```

After every server step: `ssh root@<IP> 'docker ps --filter name=racuni --format "{{.Names}} {{.Status}}"'` shows the three Računi containers unchanged, and `curl -sI https://kucniracuni.com/api/health | head -1` is still `302`.

---

## 4. Routine deploy

- **Push to `main`** → CI (`ci.yml`: two parallel jobs — lint / typecheck / test / build / bundle budget / content + the generated-content drift check, and the Playwright suite on Chromium desktop + mobile). **Deploy waits for CI** (Phase 10, `workflow_run`): only a green CI for a push to `main` starts `deploy.yml`, which builds the image of that same commit (`workflow_run.head_sha`, GHA layer cache), pushes `sha-<12>` + `latest`, then rolls out. A red CI on `main` deploys **nothing** — the previous image stays live; fix forward. Merge → live = CI + image + rollout (measured in §9).
- **Manual**: `gh workflow run deploy.yml` (rebuilds and rolls out HEAD of `main` **without waiting for CI** — the emergency bypass; otherwise let the gate do its job).
- **Watching a rollout**: a `workflow_run`-triggered run is listed under Actions → Deploy, not among the commit's own checks. `gh run list --workflow=Deploy --limit 1 --json databaseId,headSha,status,conclusion` (then `gh run watch <id> --exit-status`) is the way to follow it; if no Deploy run appears within a minute of CI going green, the fault is in the trigger, not on the box — roll out by hand and fix the trigger forward.
- **PRs** that touch the Dockerfile, `.dockerignore`, `next.config.mjs` or the workflow get a build-only run, so a broken image never reaches `main` unnoticed.
- **Logs on the box**: `ssh deploy@<IP> '/srv/learn365/dc.sh logs --tail 100 web'`.
- **SSH budget**: the VPS has `ufw limit` on port 22 (Računi hardening): more than 6 new connections from one IP within 30 s and the rest are dropped for a while. The workflow therefore uses a pinned host key (`DEPLOY_HOST_KEY`) and opens exactly one connection; never add `ssh-keyscan` back (it opens one connection per key type and tripped the limit on the first rollout). When operating by hand, keep bursts of scp/ssh under 5 and wait a minute if a connection times out.

## 5. Environment variables

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build arg from repo variable `SITE_URL` | Public origin for `metadataBase` / canonical / Open Graph / sitemap. Empty → `https://istorija365.com` (so a stray build never declares itself canonical). |
| `IMAGE_TAG` | `/srv/learn365/.env`, written by `deploy.sh` | Which image tag compose runs. |
| `DEPLOY_HOST_KEY` | repo variable | Pinned `<IP> ssh-ed25519 …` line for the runner's `known_hosts` (no keyscan). |
| `POSTGRES_PASSWORD` | `/srv/learn365/.env` → `db` | Password of the `learn365` database role. Hex only (`openssl rand -hex 24`) so the URL below needs no encoding. |
| `DATABASE_URL` | `/srv/learn365/.env` → `web` | `postgres://learn365:<POSTGRES_PASSWORD>@db:5432/learn365`. Empty = no database, no accounts. |
| `APP_URL` | `/srv/learn365/.env` → `web` | Public origin (`https://istorija365.com`); the Google redirect URI is `<APP_URL>/api/auth/google/callback` and mutating API calls must carry this `Origin`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | `/srv/learn365/.env` → `web` | OAuth client (Web application) from the app's own Google Cloud project. |
| `MIGRATIONS_DIR` | set in the Dockerfile | Where `instrumentation.ts` reads the drizzle-kit SQL migrations at server start. |

Runtime secrets exist only in `/srv/learn365/.env` (owner `deploy`, mode 600) — never in the image, the repo or GitHub. Accounts are on only when `DATABASE_URL`, `APP_URL` and both Google values are set; with any of them empty the app is the pre-Phase-8 app.

## 6. Rollback

Every deployed tag stays in GHCR. On the box:

```
ssh deploy@<IP> 'bash /srv/learn365/deploy.sh sha-<previous 12 chars>'
```

That is the same script the workflow runs, so a rollback is a normal rollout of an older tag. Fix forward on `main` afterwards. A red CI on `main` is **not** a rollback case: since Phase 10 nothing is deployed for that commit, the previous image simply stays live. Since Phase 12 a rollout whose image never becomes healthy **rolls itself back**: `deploy.sh` restores the previous tag, brings `web` up again and reports both outcomes in the Deploy run (still red, so the failure is seen). The manual command above remains for everything else.

## 7. Pre-production gates

The Phase 5 manual gates (screen-reader smoke, editorial review of the 6 seed lessons) remain open and were consciously overridden for the Vercel launch (2026-05-14). The migration does not re-gate on them; they are tracked in [PROJECT_STATE.md](PROJECT_STATE.md).

## 8. Vercel decommission — done 2026-09-28

1. Project `learn365-web` deleted by the owner in the Vercel dashboard; `https://learn365-web.vercel.app/` now answers `404 DEPLOYMENT_NOT_FOUND`. The "Vercel" / "Vercel Preview Comments" checks disappear from PRs with it.
2. The `SITE_URL` fallback has been the production origin since PR #37, and every page carries a `<link rel="canonical">` to it.
3. `HANDOFF.md` / `PROJECT_STATE.md` live-URL lines updated the same day.

## 9. Status — deploy pipeline

| Step | Status |
|---|---|
| Image pipeline in repo (Dockerfile, workflow, `deploy/`) | done — 2026-09-26 |
| Dockerfile validated by a build-only workflow run | done — PR #31 (image job 25 s with GHA cache; Vercel preview also green) |
| Domain | done — `istorija365.com` (Cloudflare Registrar, 2026-09-27) |
| VPS user + folders (`vps-install.sh`), compose + scripts in `/srv/learn365`, deploy key `~/.ssh/learn365_deploy` | done — 2026-09-26 (Računi containers verified unchanged before and after) |
| Tunnel `learn365` (`a5267830-0c3e-423c-9508-b07e074f234e`) + DNS | done — 2026-09-27; `learn365-cloudflared` registers 2 connections; CNAME `@` + `www` → `<tunnel-id>.cfargotunnel.com`, proxied (added by hand in the dashboard, see the warning in §3b step 4) |
| GitHub secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`) | done — 2026-09-26; `SITE_URL` = `https://istorija365.com` set 2026-09-27 and baked into the running image |
| First rollout | done — 2026-09-27 manual `deploy.sh sha-11c51e776f3f` (first workflow rollout hit the ufw SSH limit, fixed by the pinned host key); `learn365-web` healthy, 64 MB RSS, `GET /` 200 from the compose network. Public URL check pending the domain. |
| Public URL check | done — 2026-09-27: apex + `www` 200 over HTTPS, `og:url` = domain, `/_next/static` served with `cf-cache-status: HIT` |
| Vercel deleted | done — 2026-09-28 (owner, dashboard); `learn365-web.vercel.app` → 404 |
| Phase 8 code (db, auth, sync) | done — PR #34 squash-merged as `06e6a55`, rolled out 2026-09-27 |
| Phase 8 switched on (§10) | done — 2026-09-27: `.env` filled (Google project `istorija365`), `learn365-db` up (postgres:17-alpine, volume `learn365-pgdata`), `web` recreated, migrations applied in 62 ms, public `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`, cron `15 3 * * *` for `backup.sh` as `deploy`, first dump 12 KB; Računi containers unchanged, RAM free 2.4 GB |
| Cloudflare `www` → apex redirect | done — 2026-09-27, 301 rule in the dashboard (query string not preserved; harmless) |
| Phase 8 manual QA on production | done — owner, 2026-09-27: the ask after the second lesson, Google sign-in, second device, un-completion, bookmarks, sign-out / re-sign-in all as expected |
| CI-gated deploy + browser suite in CI (Phase 10) | done — 2026-09-28, PR #42 (`eb7cc97`). First gated rollout: merge 18:13:06 UTC → CI green 18:14:44 (`validate` 1 m 16 s, `e2e` 1 m 35 s: 67 pass / 1 skip) → Deploy run created 18:14:46 from `workflow_run` on the merge SHA → image 2 m 03 s → rollout 18 s → live 18:17:19 = **4 m 13 s merge → live** (was ≈ 2 m 45 s with the ungated parallel deploy). `/api/health` ok, `day-200` `200` |

## 10. Database and accounts (Phase 8)

**Turning it on (once, ~10 min).** The image is already deployed dark; nothing below changes code.

1. Owner: Google Cloud project + OAuth client + consent screen, and the Cloudflare `www` → apex redirect — steps in [archive/phases/PHASE_8_PLAN.md](archive/phases/PHASE_8_PLAN.md) §3.
2. Fill `/srv/learn365/.env` from `deploy/.env.example` (`POSTGRES_PASSWORD` via `openssl rand -hex 24`, the same value inside `DATABASE_URL`).
3. `scp deploy/docker-compose.yml deploy/backup.sh deploy@<IP>:/srv/learn365/ && ssh deploy@<IP> 'chmod +x /srv/learn365/backup.sh'` — the new compose needs `POSTGRES_PASSWORD`, so this comes **after** step 2.
4. `ssh deploy@<IP> '/srv/learn365/dc.sh up -d db && /srv/learn365/dc.sh up -d web'` — `web` restarts with the env; `instrumentation.ts` applies migrations before the first request.
5. `curl -s https://<DOMEN>/api/health` → `{"ok":true,"auth":true,"db":"ok"}`. `db: "off"` means `DATABASE_URL` is empty; `db: "error"` (503) means the database is unreachable — reading still works, only accounts are off.
6. `ssh deploy@<IP> 'crontab -l 2>/dev/null; (crontab -l 2>/dev/null; echo "15 3 * * * /srv/learn365/backup.sh >> /srv/learn365/backups/backup.log 2>&1") | crontab -'` — one line, user `deploy`, nothing of Računi's.
7. The usual check: three `racuni-*` containers unchanged, `https://kucniracuni.com/api/health` still `302`.

**Migrations.** Generated on the laptop (`pnpm --filter @learn365/web db:generate`) into `apps/web/lib/server/db/migrations/` and committed; applied at server start. Additive only: an older image keeps running against a newer schema, so §6 rollback stays a plain re-tag. A failing migration keeps `web` unhealthy and `deploy.sh` rolls back to the previous tag (Phase 12). An **unreachable** database at start-up is different (Phase 12): `web` starts anyway, reading works, `/api/health` says `db: "error"`, and the migration is retried in the background every 15 s for 10 minutes (`instrumentation.ts` → `migrateAtStartup`). postgres.js runs with `connect_timeout` 5 s and `statement_timeout` 10 s; a heavy future migration must raise the timeout for its own statement (`SET LOCAL statement_timeout`).

**Backups.** `backup.sh` writes `learn365-YYYY-MM-DD.dump` (custom format, mode 600 via `umask 077`) nightly, verifies it with `pg_restore --list` (the `backup.log` line ends with `N unosa`; an unreadable dump exits 1) and keeps 14. They live on the same box — protection against a bad deploy or a bad migration, not against losing the VPS; an off-box copy is a follow-up with an owner decision on destination (then a five-line `rsync` / `rclone` step at the end of the script).

**Restore (rehearse once).**

```
ssh deploy@<IP>
/srv/learn365/dc.sh stop web
docker exec -i learn365-db psql -U learn365 -d postgres -c 'DROP DATABASE learn365;' -c 'CREATE DATABASE learn365 OWNER learn365;'
docker exec -i learn365-db pg_restore -U learn365 -d learn365 --no-owner < /srv/learn365/backups/learn365-<date>.dump
/srv/learn365/dc.sh up -d web
curl -s https://<DOMEN>/api/health
```

**Memory.** `db` is capped at 256 MB (`shared_buffers` 32 MB, `max_connections` 20; the app pool is 5). Check `free -h` after the first day; Računi's SQL Server cap (1.5 GB) is untouched.

## 11. Contact address — `kontakt@istorija365.com`

The address on `/o-aplikaciji` and `/privatnost` is an alias on the production domain, not a mailbox. The forwarding rule was created and verified with a test mail on 2026-09-28; the steps below are the record of that setup. One-time setup, free, in the Cloudflare dashboard for the `istorija365.com` zone (not the Računi zone):

1. **Email → Email Routing → Get started.** Cloudflare adds the MX + SPF records for the zone (it warns if an existing MX would conflict; there is none).
2. **Destination addresses → Add** the owner's inbox. Cloudflare sends a verification mail; click the link.
3. **Routing rules → Create address:** custom address `kontakt`, action *Send to an email*, destination = the verified inbox. Save.
4. Send a test mail to `kontakt@istorija365.com` and confirm it lands. Replies go out from the personal inbox (fine for now; a "send as" alias in Gmail is optional).

Nothing in the repo changes for this; the code already uses the alias (`apps/web/app/o-aplikaciji/_copy.ts`).

## 12. Prerendered pages and HTML caching (Phase 9, 2026-09-28)

- `next build` prerenders the course overview and all 365 lesson pages (`prerender-manifest.json` lists 373 static routes); `next start` serves them as files, with no React render per request. The runtime image carries roughly 25 MB more (one HTML + one RSC file per page). The account pages (`/prijava`, `/nalog`) and `/api/**` stay dynamic.
- Those pages answer with `cache-control: s-maxage=31536000`. **Cloudflare does not cache HTML by default, and no cache rule may be added without purge-on-deploy in `deploy.sh` first:** a cached page that references chunk hashes from the previous image is a broken page until purge. Today the edge caches `/_next/static` only, which is content-hashed and safe.
- Client JS per route is 100–141 kB gzip (933–945 before Phase 9). `pnpm --filter @learn365/web check-bundle` (a CI step after Build) enforces 175 kB gzip per route and 300 kB raw per chunk.
