# Deploy

Canonical deploy procedure for Learn365 web. **Target since 2026-09-26: the owner's Hetzner VPS**, shared with the Računi app, behind a Cloudflare Tunnel. Vercel (`learn365-web.vercel.app`) stays up only until the custom domain serves from the VPS, then it is deleted (§8).

Backend/auth (accounts, cloud progress) is the next step after this migration — see [BACKEND_STRATEGY.md](BACKEND_STRATEGY.md).

---

## 1. Target and rationale

| | |
|---|---|
| Host | Hetzner Cloud `pavleserver` — CX23 (2 vCPU, 4 GB, 40 GB), Helsinki, Ubuntu 24.04. Already runs Računi (SQL Server Express capped at 1.5 GB + .NET app + cloudflared). |
| Runtime | Docker Compose project `learn365` in `/srv/learn365`: `web` (Next.js standalone image from GHCR, `mem_limit` 512 MB) + `cloudflared` (tunnel `learn365`). |
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
| `apps/web/lib/seo/metadata.ts` | `SITE_URL` = `NEXT_PUBLIC_SITE_URL` at build time, Vercel origin as fallback. Feeds `metadataBase` / Open Graph. |
| `apps/web/Dockerfile` | 3 stages: deps (manifests only, pnpm 9.15 via npm, store cache) → build (`@learn365/ui` emits `dist/globals.css`, then `next build`) → runtime (`node:22-bookworm-slim`, non-root `node`, `HEALTHCHECK` = `GET /`). Context is the **repo root**; `.dockerignore` trims it. |
| `.github/workflows/deploy.yml` | PR touching deploy files → build only. Push to `main` / manual → build, push to GHCR, ssh rollout. Rollout is a no-op until `DEPLOY_HOST` / `DEPLOY_SSH_KEY` exist. |
| `deploy/docker-compose.yml` | `web` + `cloudflared`. Copied to `/srv/learn365/docker-compose.yml`. |
| `deploy/cloudflared/config.yml` | Tunnel ingress template (`<TUNNEL_ID>`, `<DOMEN>` placeholders). Copied to `/srv/learn365/cloudflared/config.yml`; the credentials JSON is never in the repo. |
| `deploy/dc.sh` | `docker compose` wrapper pinned to `/srv/learn365` + its `.env`. |
| `deploy/deploy.sh` | The rollout script the workflow calls (see §1). |
| `deploy/vps-install.sh` | One-time root script: user `deploy` (docker group, key-only, no forwarding) + `/srv/learn365` folders. Does nothing else. |
| `deploy/.env.example` | `IMAGE_TAG` only; no secrets in this phase. |
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
cloudflared tunnel create learn365                       # prints <TUNNEL_ID>, writes ~/.cloudflared/<TUNNEL_ID>.json
cloudflared tunnel route dns learn365 <DOMEN>
cloudflared tunnel route dns learn365 www.<DOMEN>
sed "s/<TUNNEL_ID>/<id>/g; s/<DOMEN>/<domen>/g" deploy/cloudflared/config.yml > /tmp/config.yml
scp /tmp/config.yml ~/.cloudflared/<TUNNEL_ID>.json root@<IP>:/srv/learn365/cloudflared/
ssh root@<IP> 'chown 65532:65532 /srv/learn365/cloudflared/*; chmod 600 /srv/learn365/cloudflared/*.json; chmod 644 /srv/learn365/cloudflared/config.yml'

# 5. GitHub: secrets + build-time site URL
gh secret set DEPLOY_HOST --body <IP>
gh secret set DEPLOY_USER --body deploy
gh secret set DEPLOY_SSH_KEY < ~/.ssh/learn365_deploy
gh variable set SITE_URL --body https://<DOMEN>

# 6. first rollout: merge to main (or `gh workflow run deploy.yml`), then start the tunnel
ssh deploy@<IP> '/srv/learn365/dc.sh up -d cloudflared && /srv/learn365/dc.sh ps'
curl -sI https://<DOMEN>/ | head -1                      # HTTP/2 200
```

After every server step: `ssh root@<IP> 'docker ps --filter name=racuni --format "{{.Names}} {{.Status}}"'` shows the three Računi containers unchanged, and `curl -sI https://kucniracuni.com/api/health | head -1` is still `302`.

---

## 4. Routine deploy

- **Push to `main`** → CI (`ci.yml`) and Deploy (`deploy.yml`) run in parallel. Deploy builds the image (GHA layer cache), pushes `sha-<12>` + `latest`, then rolls out. A red CI does **not** block the rollout — treat a red CI on `main` as revert-now.
- **Manual**: `gh workflow run deploy.yml` (rebuilds and rolls out HEAD of `main`).
- **PRs** that touch the Dockerfile, `.dockerignore`, `next.config.mjs` or the workflow get a build-only run, so a broken image never reaches `main` unnoticed.
- **Logs on the box**: `ssh deploy@<IP> '/srv/learn365/dc.sh logs --tail 100 web'`.

## 5. Environment variables

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build arg from repo variable `SITE_URL` | Public origin for `metadataBase` / Open Graph. Empty → Vercel fallback. |
| `IMAGE_TAG` | `/srv/learn365/.env`, written by `deploy.sh` | Which image tag compose runs. |

Runtime secrets: none in this phase. The auth phase adds its own `.env` entries (Google client, database URL) to `/srv/learn365/.env` only.

## 6. Rollback

Every deployed tag stays in GHCR. On the box:

```
ssh deploy@<IP> 'bash /srv/learn365/deploy.sh sha-<previous 12 chars>'
```

That is the same script the workflow runs, so a rollback is a normal rollout of an older tag. Fix forward on `main` afterwards.

## 7. Pre-production gates

The Phase 5 manual gates (screen-reader smoke, editorial review of the 6 seed lessons) remain open and were consciously overridden for the Vercel launch (2026-05-14). The migration does not re-gate on them; they are tracked in [PROJECT_STATE.md](PROJECT_STATE.md).

## 8. Vercel decommission

Once `https://<DOMEN>/` serves from the VPS for a day without incident:

1. Vercel dashboard → project `learn365-web` → Settings → *Delete project*.
2. Remove the `learn365-web.vercel.app` fallback from `apps/web/lib/seo/metadata.ts` (make `NEXT_PUBLIC_SITE_URL` required at build).
3. Update `HANDOFF.md` / `PROJECT_STATE.md` live-URL lines.

## 9. Status

| Step | Status |
|---|---|
| Image pipeline in repo (Dockerfile, workflow, `deploy/`) | done — 2026-09-26 |
| Dockerfile validated by a build-only workflow run | done — PR #31 (image job 25 s with GHA cache; Vercel preview also green) |
| Domain | pending — owner |
| VPS user + folders (`vps-install.sh`), compose + scripts in `/srv/learn365`, deploy key `~/.ssh/learn365_deploy` | done — 2026-09-26 (Računi containers verified unchanged before and after) |
| Tunnel `learn365` + DNS | pending — needs domain |
| GitHub secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`) | done — 2026-09-26; `SITE_URL` variable pending the domain |
| First rollout + public URL check | pending |
| Vercel deleted | pending |
