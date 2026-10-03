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
| Image | Built by GitHub Actions ([.github/workflows/deploy.yml](../.github/workflows/deploy.yml)) from [apps/web/Dockerfile](../apps/web/Dockerfile), pushed to `ghcr.io/pavlekukric/learn365-web` as `sha-<12>`, plus `latest` only when that commit passed CI and is still the tip of `main` (review 2026-10-03: `latest` never moves backwards). Nothing rolls out `latest`; it is only the compose fallback a fresh box starts on. **Never built on the VPS** (2 vCPU, RAM shared with SQL Server). |
| Rollout | The workflow ssh-es in as user `deploy` and runs `/srv/learn365/deploy.sh <tag>`: `docker pull` of the tag, then writes `IMAGE_TAG` to `.env`, `compose up -d web`, waits for the image healthcheck, prunes older `learn365-web` tags only. |

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
| `.github/workflows/ci.yml` | Two parallel jobs on every PR and push to `main` (Phase 10): `validate` = install → validate-content → generated-content drift check (`pnpm gen-content` + `git diff`) → lint → typecheck → test → build → bundle budget; `e2e` = Playwright on Chromium desktop + mobile against `next start`, accounts off. Review 2026-10-03: `permissions: contents: read`, every action pinned by commit SHA (`# vX.Y.Z` comment), and a warn-only `pnpm audit --prod --audit-level=high` step in `validate` (`continue-on-error`; it lists 4 high + 2 moderate build-time postcss / nanoid advisories inside `next` today). |
| `.github/workflows/lighthouse.yml` | Warn-only mobile Lighthouse on Home, the course overview and Day 1 (`apps/web/scripts/lighthouse.mjs`), on every PR, nightly at 02:00 UTC against `main`, and by hand. Moved out of `ci.yml` in review 2026-10-03: deploy waits for the **whole** CI workflow, and this 3½-minute job was its slowest part. |
| `.github/dependabot.yml` | Weekly (Monday) PRs: npm (minor + patch grouped into one PR, majors one each) and GitHub Actions (all in one PR; keeps the SHA pins and their version comments current). Each PR runs the full CI. |
| `.github/workflows/deploy.yml` | PR touching deploy files → build only. Green CI for a push to `main` (`workflow_run`, Phase 10) / manual → build, push to GHCR, ssh rollout; the commit built is the one CI validated (`workflow_run.head_sha`). Rollout is a no-op until `DEPLOY_HOST` / `DEPLOY_SSH_KEY` exist. `latest` is pushed only from a green-CI run whose commit is still the tip of `main` (a re-run of an older commit or the manual bypass pushes `sha-<12>` alone). Top-level `permissions: {}`; the image job gets `packages: write`, the rollout job `contents: read`. |
| `deploy/docker-compose.yml` | `db` + `web` + `cloudflared`. Copied to `/srv/learn365/docker-compose.yml`. Secrets reach containers only through explicit `environment:` mappings interpolated from `.env` (no `env_file`). `web` depends on `db` with `service_started` (Phase 12): reading needs no database, so `web` boots even while `db` is still coming up or sick. |
| `deploy/cloudflared/config.yml` | Tunnel ingress template (`<TUNNEL_ID>`, `<DOMEN>` placeholders). Copied to `/srv/learn365/cloudflared/config.yml`; the credentials JSON is never in the repo. |
| `deploy/dc.sh` | `docker compose` wrapper pinned to `/srv/learn365` + its `.env`. |
| `deploy/deploy.sh` | The rollout script the workflow calls (see §1). Phase 12: remembers the previous `IMAGE_TAG`, and when the new image does not become healthy within 150 s, or migrations do not apply, it restores the previous tag, brings `web` up again and waits once more before exiting 1; the prune keeps the new, the previous and `latest` images. Review 2026-10-03: the image is pulled **before** `IMAGE_TAG` is written, so a failed pull leaves `.env` and the running `web` untouched; any other unexpected error after the tag is written (e.g. `up -d web` fails) goes through an `ERR` trap into the same rollback. |
| `deploy/vps-install.sh` | One-time root script: user `deploy` (docker group, key-only, no forwarding, forced command) + `/srv/learn365` folders. Does nothing else. |
| `deploy/ssh-command.sh` | Forced command for the GitHub Actions deploy key (Phase 14): accepts exactly `bash /srv/learn365/deploy.sh sha-<12 hex>` from `SSH_ORIGINAL_COMMAND` and refuses everything else. Lives at `/srv/learn365/ssh-command.sh`; the key's `authorized_keys` line names it in `command="…"` (§13a). |
| `deploy/.env.example` | `IMAGE_TAG` + the Phase 8 runtime values: `POSTGRES_PASSWORD`, `DATABASE_URL`, `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. |
| `deploy/backup.sh` | Nightly `pg_dump -Fc` of the `db` container into `/srv/learn365/backups/`, 14-day retention. One cron line for user `deploy` (§10). Phase 12: `umask 077` (dumps readable by `deploy` only) and every dump is checked with `pg_restore --list` before it counts (the log line carries the entry count; an empty list exits 1). Review 2026-10-03: leftover `*.dump.part` files from a failed or killed dump are removed (at start and on exit), and with an off-box target the destination is pruned to the same 14 newest dumps (§10). |
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
scp deploy/docker-compose.yml deploy/dc.sh deploy/deploy.sh deploy/backup.sh deploy/ssh-command.sh deploy@<IP>:/srv/learn365/
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

- **Push to `main`** → CI (`ci.yml`: two parallel jobs — lint / typecheck / test / build / bundle budget / content + the generated-content drift check, and the Playwright suite on Chromium desktop + mobile, plus since review 2026-09-30 an axe pass and an accounts-on project against a seeded PGlite database; Firefox + WebKit run nightly in `e2e-nightly.yml`, not as a gate; the warn-only Lighthouse job runs on PRs and nightly in `lighthouse.yml`, so deploy never waits for it). **Deploy waits for CI** (Phase 10, `workflow_run`): only a green CI for a push to `main` starts `deploy.yml`, which builds the image of that same commit (`workflow_run.head_sha`, GHA layer cache), pushes `sha-<12>` (+ `latest` while that commit is still the tip of `main`), then rolls out. A red CI on `main` deploys **nothing** — the previous image stays live; fix forward. Merge → live = CI + image + rollout (measured in §9).
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
| Backend reliability set (Phase 12) | code live — 2026-09-28, PR #46 (`3a315c8`), 4 m 35 s merge → live: 503 on outage, cookie re-set, tolerant start-up, postgres.js timeouts. **Box rollout done by the owner 2026-09-28 20:14 UTC:** the three files moved into place (old copies kept as `*.bak-2026-09-28`), `dc.sh config` ok, `dc.sh up -d web` left the running container as is — the new `depends_on` applies from the next rollout, which already runs the new `deploy.sh`; `learn365-web` and `learn365-db` healthy, `cloudflared` up, Računi containers unchanged. The first verified dump is the next nightly run (`backup.log` line ending in `N unosa`). The commands, for the record — as `deploy` (`ssh -i ~/.ssh/learn365_deploy deploy@<IP>`): `cd /srv/learn365 && for f in deploy.sh backup.sh docker-compose.yml; do cp -p "$f" "$f.bak-$(date +%F)"; mv ".phase12/$f" "$f"; done && rmdir .phase12 && chmod +x deploy.sh backup.sh && bash -n deploy.sh && bash -n backup.sh && ./dc.sh config --quiet && ./dc.sh up -d web && ./dc.sh ps` — then the usual Računi check (`docker ps --filter name=racuni`) and `curl -s https://istorija365.com/api/health`. The next nightly `backup.log` line should end with `N unosa`. |
| Security headers + `__Host-` cookies (Phase 14) | done — 2026-09-28, PR #51 (`3de5168`), 4 m 20 s merge → live, headers verified on production: CSP, HSTS, nosniff, Referrer-Policy, frame-ancestors / X-Frame-Options, Permissions-Policy on every response, `x-powered-by` gone; the session cookie is `__Host-l365_session` (the old name is read for one release and migrated on the next `/api/me`). Check: `curl -sI https://istorija365.com/ \| grep -iE "content-security|strict-transport|x-content|referrer|x-frame|permissions|x-powered"`. |
| Deploy key forced command + Cloudflare rate limit (Phase 14) | **owner actions, pending** — §13 |
| Ops set (review 2026-09-30 item 10): `/api/health` `migrations`, endless capped migration retry, healthcheck 15 s / 45 s, `deploy.sh` waits 150 s + migrations, `backup.sh` keeps exactly 14 + optional off-box copy | code in the repo (image changes ship with the merge). **Box files pending, owner:** as `deploy`, copy the new `deploy/deploy.sh` and `deploy/backup.sh` to `/srv/learn365/` (keep `*.bak-<date>` copies as in the Phase 12 row, `chmod +x`, `bash -n` both). Order does not matter: the new `deploy.sh` also accepts images without the `migrations` field (`legacy`), and the old one ignores it. Off-box destination + restore test: §10 owner steps. |
| CI / deploy hardening (review 2026-10-03 P2 10–11): Lighthouse off the deploy path, `permissions:` + SHA-pinned actions, `latest` forward-only, Dependabot, warn-only audit; `deploy.sh` pulls before writing the tag + `ERR` trap rollback; `backup.sh` removes stale `.part` files and prunes the off-box copy to 14 | workflows live with the merge. **Box files pending, owner:** as `deploy`, copy the new `deploy/deploy.sh` and `deploy/backup.sh` to `/srv/learn365/` — `scp deploy/deploy.sh deploy/backup.sh deploy@<IP>:/srv/learn365/.new/` with the operator key, then on the box `cd /srv/learn365 && for f in deploy.sh backup.sh; do cp -p "$f" "$f.bak-$(date +%F)"; mv ".new/$f" "$f"; done && rmdir .new && chmod +x deploy.sh backup.sh && bash -n deploy.sh && bash -n backup.sh`. Until then the old `deploy.sh` keeps working (same arguments, same forced command). Check after the next merge: the Deploy run's log ends with `deploy ok: …`. |
| Visit statistics — Cloudflare Web Analytics | done — 2026-09-29, PR #55 (`ab4442d`), live 08:39 UTC, verified in a browser (beacon `200`, reports `204`, console clean, no cookie): CSP `script-src` names `static.cloudflareinsights.com`, `/privatnost` has `Statistika poseta` — §14 |

## 10. Database and accounts (Phase 8)

**Turning it on (once, ~10 min).** The image is already deployed dark; nothing below changes code.

1. Owner: Google Cloud project + OAuth client + consent screen, and the Cloudflare `www` → apex redirect — steps in [archive/phases/PHASE_8_PLAN.md](archive/phases/PHASE_8_PLAN.md) §3.
2. Fill `/srv/learn365/.env` from `deploy/.env.example` (`POSTGRES_PASSWORD` via `openssl rand -hex 24`, the same value inside `DATABASE_URL`).
3. `scp deploy/docker-compose.yml deploy/backup.sh deploy@<IP>:/srv/learn365/ && ssh deploy@<IP> 'chmod +x /srv/learn365/backup.sh'` — the new compose needs `POSTGRES_PASSWORD`, so this comes **after** step 2.
4. `ssh deploy@<IP> '/srv/learn365/dc.sh up -d db && /srv/learn365/dc.sh up -d web'` — `web` restarts with the env; `instrumentation.ts` applies migrations before the first request.
5. `curl -s https://<DOMEN>/api/health` → `{"ok":true,"auth":true,"db":"ok","migrations":"ok"}`. `db: "off"` means `DATABASE_URL` is empty (then `migrations: "off"` too); `db: "error"` (503) means the database is unreachable — reading still works, only accounts are off. `migrations` (review 2026-09-30): `pending` (503) = not applied yet — the server just started or the database has not answered yet and the background retry is waiting on it; `failed` (503) = a migration threw, accounts stay off until the next deploy; `ok` = applied in this process.
6. `ssh deploy@<IP> 'crontab -l 2>/dev/null; (crontab -l 2>/dev/null; echo "15 3 * * * /srv/learn365/backup.sh >> /srv/learn365/backups/backup.log 2>&1") | crontab -'` — one line, user `deploy`, nothing of Računi's.
7. The usual check: three `racuni-*` containers unchanged, `https://kucniracuni.com/api/health` still `302`.

**Migrations.** Generated on the laptop (`pnpm --filter @learn365/web db:generate`) into `apps/web/lib/server/db/migrations/` and committed; applied at server start. Additive only: an older image keeps running against a newer schema, so §6 rollback stays a plain re-tag. A failing migration keeps `web` unhealthy and `deploy.sh` rolls back to the previous tag (Phase 12). An **unreachable** database at start-up is different (Phase 12): `web` starts anyway, reading works, `/api/health` says `db: "error"`, `migrations: "pending"`, and the migration is retried in the background — 15 s, 30 s, then every 60 s, **for as long as the database stays away** (review 2026-09-30; before, it gave up after 10 minutes and accounts stayed off until a restart). A migration that fails on a retry stops the loop and reports `migrations: "failed"`.

**What `deploy.sh` waits for** (review 2026-09-30). First the image's Docker healthcheck (`GET /`, every 15 s, failures ignored for the first 45 s, `unhealthy` after 3 misses in a row) — up to 150 s, and it stops early on Docker's `unhealthy` verdict. Then, only when a database is configured, `/api/health` (asked from inside the container) until `migrations` is `ok` — up to 120 s; `failed` or still `pending` after that rolls back exactly like an unhealthy image. `off` (no database) and an older image without the field (a manual §6 rollback to an old tag) pass. Consequence: while the database is down, a rollout does not stick — the previous tag stays live, which is what you want anyway; start the database, then re-run the deploy. postgres.js runs with `connect_timeout` 5 s and `statement_timeout` 10 s; a heavy future migration must raise the timeout for its own statement (`SET LOCAL statement_timeout`).

**Backups.** `backup.sh` writes `learn365-YYYY-MM-DD.dump` (custom format, mode 600 via `umask 077`) nightly, verifies it with `pg_restore --list` (the `backup.log` line ends with `N unosa`; an unreadable dump exits 1) and keeps **exactly the 14 newest** by name (review 2026-09-30; the old `find -mtime +14` kept 15–16). On the box alone they protect against a bad deploy or a bad migration, not against losing the VPS — hence the off-box copy below.

**Hetzner Backups (on since 2026-10-01).** The owner enabled Hetzner Cloud Backups for `pavleserver` (Console → server → Backups; 20 % of the server price, ~1.10 €/month on top of 5.49 €). Hetzner keeps 7 daily images of the whole 38 GB disk — Istorija 365 **and Računi**, OS, Docker, `.env` — on its own storage, not on the server's disk. Restore is all-or-nothing (the whole server goes back to that day, both apps) or into a new server; a manual "Create backup" takes one of the 7 slots; deleting the server deletes its backups (take a Snapshot first). The databases are imaged while running (crash-consistent), so for user data the nightly `pg_dump` above stays the clean copy. It does not protect against losing the Hetzner account — that is what the off-box copy below is for (still optional; the owner chose Hetzner Backups first, 2026-10-01).

**Off-box copy (optional, review 2026-09-30).** `backup.sh` reads one line from `/srv/learn365/.env`, `BACKUP_OFFBOX_TARGET`; empty or missing = no off-box step (today's behaviour). Set, it copies the night's dump there after the local check passes, adds a `offbox ok: … → …` line to `backup.log`, and exits 1 with `offbox NEUSPEH: …` if the copy fails (the local dump is kept either way). After the copy it prunes the destination to the **14 newest** `learn365-YYYY-MM-DD.dump` files, matching the 14 days `/privatnost` promises (review 2026-10-03; before that nothing was deleted there). The prune works from the destination's own listing, not by mirroring the local folder, so a rebuilt box with an empty `backups/` does not wipe the off-box history; other files at the destination are never touched. rclone: `lsf` + `deletefile`; rsync: `--list-only`, then an empty-folder `--delete` filtered to exactly the old names (works on an rsync-only / `rrsync` target too). A failed prune logs `offbox NEUSPEH: … prune …` and exits 1; the copy itself is already done. On B2, `deletefile` hides the old version; set the bucket's lifecycle to "keep only the last version" so hidden versions go too.

- `rclone:<remote>:<path>` — any rclone backend (Backblaze B2, S3, Google Drive…). **Use an rclone `crypt` remote on top**: the dumps hold account e-mails and names (personal data, `/privatnost`), so they must not sit readable at a third party.
- `rsync:<user>@<host>:<path>` — rsync over ssh to a machine the owner controls (home NAS, second box), with a key of the `deploy` user.

Owner steps (once, ~15 min; nothing here touches Računi):

1. Pick the destination. Recommended: a Backblaze B2 bucket (free tier covers this) behind an rclone `crypt` remote; keep the crypt password in the password manager — without it the copies are unreadable, also to you.
2. On the box, as root: `apt-get install -y rclone` (or `rsync` for the second option — usually already there).
3. As `deploy`: `rclone config` → create the B2 remote (e.g. `b2`), then a `crypt` remote over it (e.g. `b2crypt` → `b2:<bucket>/learn365`). The config lands in `~deploy/.config/rclone/rclone.conf`; `chmod 600` it. For rsync instead: `ssh-keygen -t ed25519 -f ~/.ssh/learn365_backup -N ''`, put the public key on the target, and add a `Host` entry in `~deploy/.ssh/config` with `IdentityFile ~/.ssh/learn365_backup`.
4. Add `BACKUP_OFFBOX_TARGET=rclone:b2crypt:` (or `rsync:…`) to `/srv/learn365/.env`, and copy the new `deploy/backup.sh` into `/srv/learn365/` (`chmod +x`, `bash -n backup.sh`).
5. Run it once by hand: `/srv/learn365/backup.sh` → two lines, `backup ok: …` and `offbox ok: …`; `rclone ls b2crypt:` lists the dump.
6. Do the restore test below once, from the **off-box** copy, and note the date in §9.

**Restore test (rehearse once, and after any change to the backup chain).** Restores into a scratch database next to the live one — the live `learn365` database and `web` are not touched:

```
ssh deploy@<IP>
cd /tmp
# 1) take the newest dump — from off-box to prove that copy works (or from /srv/learn365/backups/)
rclone copy b2crypt:learn365-<date>.dump /tmp/          # rsync: rsync <user>@<host>:<path>/learn365-<date>.dump /tmp/
# 2) restore into a throwaway database
docker exec learn365-db createdb -U learn365 learn365_restore_test
docker exec -i learn365-db pg_restore -U learn365 -d learn365_restore_test --no-owner < /tmp/learn365-<date>.dump
# 3) compare with live: the counts should match (live may be a few rows ahead since 03:15)
for db in learn365 learn365_restore_test; do
  docker exec learn365-db psql -U learn365 -d "$db" -Atc "select '$db', (select count(*) from users), (select count(*) from lesson_completions), (select count(*) from bookmarks)"
done
# 4) clean up
docker exec learn365-db dropdb -U learn365 learn365_restore_test
rm -f /tmp/learn365-<date>.dump
```

**Restore for real** (the live database is replaced — only after a loss):

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
- Client JS per route is 100–141 kB gzip (933–945 before Phase 9). `pnpm --filter @learn365/web check-bundle` (a CI step after Build) enforces 175 kB gzip per route and 300 kB raw per chunk. Since review 2026-09-30 a route counts the union of its page entry and every layout / boundary entry above it (root layout, the lesson segment's layout, `not-found`): 127–145 kB gzip measured 2026-09-30, the lesson route the largest.

## 13. Owner actions from Phase 14 (review P2 item 20)

Two one-off, reversible steps. Neither touches Računi. Do 13a before or after the Phase 14 rollout — the rollout command is the same either way.

### 13a. The deploy key may run only `deploy.sh` (forced command)

Today the GitHub Actions key opens a plain shell as `deploy` (a member of the `docker` group). With the forced command the same key can run exactly `bash /srv/learn365/deploy.sh sha-<12 hex>` and nothing else: a leaked `DEPLOY_SSH_KEY` could redeploy this app to an image that is already public, and that is all.

**The prefix is `restrict,command="…"`, not `command="…",no-pty` (corrected 2026-09-30, review P0 item 2).** A forced command governs only the session channel. Without `restrict` (or `no-port-forwarding`) the key can still open `ssh -N -L /tmp/d.sock:/var/run/docker.sock deploy@<IP>`, and `deploy` is in the `docker` group — that socket is root on the whole VPS, Računi included. `restrict` turns off pty, agent, X11 and every kind of forwarding at once. If 13a was already applied with the old `no-pty` prefix, step 2b upgrades the line.

**Before you start:** the manual box work so far ran as `deploy` with that same key. After 13a the GitHub key refuses everything but `deploy.sh`, so manual work as `deploy` needs a second key (the laptop's own) in `deploy`'s `authorized_keys`, or goes through `root`. Add the laptop key first if it is not there yet:

```
ssh root@<IP> 'cat >> /home/deploy/.ssh/authorized_keys' < ~/.ssh/id_ed25519.pub     # laptop key, plain line
ssh deploy@<IP> id                                                                   # works with the laptop key
```

Then, from the laptop:

```
# 1. the script (kept with the other deploy/ files)
scp deploy/ssh-command.sh deploy@<IP>:/srv/learn365/
ssh deploy@<IP> 'chmod +x /srv/learn365/ssh-command.sh && bash -n /srv/learn365/ssh-command.sh && echo ok'

# 2. prefix ONLY the GitHub key's line (its comment is "learn365-deploy"); a dated backup of the file stays next to it
ssh deploy@<IP> 'cp -p ~/.ssh/authorized_keys ~/.ssh/authorized_keys.bak-$(date +%F) && sed -i "/learn365-deploy\$/ s#^#restrict,command=\"/srv/learn365/ssh-command.sh\" #" ~/.ssh/authorized_keys && cat ~/.ssh/authorized_keys'

# 2b. ONLY if the line already starts with the old `command="…",no-pty,` prefix — swap it for `restrict,…`
ssh deploy@<IP> 'sed -i "/learn365-deploy\$/ s#^command=\"/srv/learn365/ssh-command.sh\",no-pty,#restrict,command=\"/srv/learn365/ssh-command.sh\" #" ~/.ssh/authorized_keys && grep learn365-deploy ~/.ssh/authorized_keys | cut -c1-60'

# 3. verify: a shell command with the GitHub key is refused (exit 126, "odbijeno: …")
ssh -i ~/.ssh/learn365_deploy deploy@<IP> id

# 4. verify: forwarding with the GitHub key is refused (ssh exits 255 — "administratively prohibited")
ssh -i ~/.ssh/learn365_deploy -o ExitOnForwardFailure=yes -N -L 127.0.0.1:23750:/var/run/docker.sock deploy@<IP>; echo "exit $?"

# 5. the secrets file is readable by deploy only (§5; vps-install.sh does this on a new box)
ssh deploy@<IP> 'chmod 600 /srv/learn365/.env && stat -c "%a %U" /srv/learn365/.env'   # → 600 deploy
```

The accept path is verified by the next gated rollout (any merge to `main`), or on demand with `gh workflow run deploy.yml` (it redeploys HEAD of `main`, ≈ 20 s of rollout). Undo: restore the `.bak-` file.

### 13b. Cloudflare rate limit on `/api/`

Dashboard → zone `istorija365.com` → **Security → WAF → Rate limiting rules → Create rule**:

| Field | Value |
|---|---|
| Name | `learn365 api` |
| If incoming requests match | `(starts_with(http.request.uri.path, "/api/"))` |
| Characteristics | IP |
| Rate | 30 requests / 10 seconds (the Free plan fixes the period at 10 s and allows one rule) |
| Then | Block, for 10 seconds |

Why 30 / 10 s: a page load makes at most three `/api/me*` calls and the sync engine coalesces its deltas, so ten seconds of ordinary use is well under ten requests; a scripted loop against `/api/auth/*` or `/api/me/*` is stopped at the edge before it reaches the box. If the plan allows a second rule, add `/api/auth/` at 6 / 10 s. Verify (this blocks your own IP for 10 s afterwards):

```
for i in $(seq 40); do curl -s -o /dev/null -w "%{http_code}\n" https://istorija365.com/api/health; done | sort | uniq -c   # some 429
```

## 14. Visit statistics — Cloudflare Web Analytics (2026-09-29)

Owner decision: visits are counted, and `/privatnost` says so.

- **Where it comes from.** Nothing in the repo. Cloudflare injects `<script src="https://static.cloudflareinsights.com/beacon.min.js/…" data-cf-beacon=…>` into the HTML at the edge, for browser requests only (a plain `curl` gets the page without it). It is the zone's Web Analytics with automatic setup.
- **What the app does.** The Content-Security-Policy in `apps/web/next.config.mjs` allows that one script origin. Reports go to `POST /cdn-cgi/rum` on this origin, which Cloudflare answers at the edge — they never reach the box.
- **What it records.** The page, the referrer, browser engine and version, OS version, load timings; Cloudflare adds the country. No cookie is set (measured).
- **Where the numbers are.** Cloudflare dashboard → **Analytics & Logs → Web Analytics** → `istorija365.com`.
- **Check.** `curl -sI https://istorija365.com/ | grep -i content-security` names `static.cloudflareinsights.com`; a browser console on any page shows no CSP error.
- **Turning it off.** Dashboard → Web Analytics → the site → **Manage site** → disable the automatic setup; then remove the origin from the CSP and the `Statistika poseta` section from `apps/web/app/privatnost/_copy.ts` in one commit (`e2e/privacy.spec.ts` holds the two together).
- **The rule.** The page and the policy change together: no second foreign script origin without a sentence on `/privatnost`.

## 15. Accounts overview `/pregled` (Phase 16)

A read-only page listing the accounts, for the owner only. It is a 404 for everyone until one account carries the flag.

1. Sign in on https://istorija365.com with the Google account that should see the page (the row must exist).
2. On the box, as `deploy` or `root`:

```
docker exec -i learn365-db psql -U learn365 -d learn365 -c "update users set is_admin = true where email = '<your address>';"
```

   `UPDATE 1` means it worked; `UPDATE 0` means no account has that address yet (step 1).
3. Open https://istorija365.com/pregled — or `/nalog` → `Pregled naloga`.

Undo: the same command with `false`. Who has the flag: `docker exec -i learn365-db psql -U learn365 -d learn365 -c "select email from users where is_admin;"`. Deleting the account on `/nalog` deletes the flag with it.
