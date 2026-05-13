# Deploy

Canonical deploy procedure for Learn365. Currently scopes the **web v1** release; backend deploy lives in [BACKEND_STRATEGY.md](BACKEND_STRATEGY.md).

This doc is migration-friendly: host-specific details are isolated to §2 so a future move (e.g. Azure) does not require rewriting it from scratch.

---

## 1. Target

**V1 web → Vercel.**

Rationale:

- Vercel is built by the Next.js team — zero-config detection for Next 15 + pnpm + Turborepo.
- Free hobby tier covers v1 traffic comfortably.
- Per-PR preview deploys with no extra configuration.
- No infra to provision while v1 has no backend and progress is local-only.

Azure was considered for tenant alignment with the planned Phase 8 .NET backend. Rejected for v1 because the web app and the future API do not yet share infrastructure (no shared VNet, no shared identity). The web app may migrate to Azure later — see §9.

---

## 2. Vercel project settings

When importing the repository in the Vercel dashboard:

| Setting | Value |
|---|---|
| Repository | the GitHub repo for `learn365` |
| Framework Preset | Next.js *(auto-detected)* |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm --filter @learn365/web... build` *(override)* |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` *(override)* |
| Output Directory | *(leave blank — Vercel detects `apps/web/.next` automatically)* |
| Node.js Version | `20.x` (must match `.nvmrc`) |

Notes:

- **Why `cd ../..` on both commands**: Vercel runs commands from `Root Directory` (= `apps/web`) by default. `pnpm install` must run at the workspace root (where `pnpm-workspace.yaml` lives) to set up all workspace packages. The filtered `pnpm --filter @learn365/web... build` must also run from the root so it can resolve the filter graph and trigger upstream package builds — most importantly `@learn365/ui`'s `tsx scripts/emit-globals.ts` which emits `dist/globals.css` that the web app's CSS imports. Without this, the web build will fail trying to resolve `@learn365/ui/globals.css`.
- **The trailing ellipsis (`@learn365/web...`)** is the pnpm "include all dependencies" syntax. It builds the web app *and* its workspace deps (`@learn365/content`, `@learn365/core`, `@learn365/ui`, `@learn365/ui-web`). Turbo's `dependsOn: ["^build"]` in [turbo.json](../turbo.json) then orders them correctly.
- **Root Directory** is `apps/web` so Vercel's framework detection lands on Next.js. Vercel still understands the workspace because `pnpm-workspace.yaml` lives at the repo root.
- **`pnpm install --frozen-lockfile`** matches the CI workflow in [.github/workflows/ci.yml](../.github/workflows/ci.yml). Frozen-lockfile prevents Vercel from silently changing dependency versions during deploy.
- **Node 20** matches `.nvmrc`. The repo `engines` allows `>=20.10` (see [reference_node_setup memory](../README.md) / `.nvmrc`) but Vercel pins a single major version per project.
- No `vercel.json` is required for v1. If we ever need redirects or custom headers, add it at `apps/web/vercel.json` so the project-root setting still applies.

---

## 3. Environment variables

**V1: none.**

No auth, no API, no analytics, no error-monitoring SDK in v1.

Reserved for v2 (do not add until the relevant phase lands):

- `NEXT_PUBLIC_API_BASE_URL` — when the .NET backend ships (Phase 8d).
- Auth-related vars (token endpoint, OAuth client IDs) when the sign-in flow lands.

---

## 4. Preview deploys

Vercel produces a preview URL for every PR and every push to a non-production branch. Reviewers can click the URL to open the change in a real browser before merging.

No configuration needed — this is on by default once the project is connected.

---

## 5. Production branch

`main` deploys to production. Vercel watches the branch and triggers a deploy on every push.

CI in [.github/workflows/ci.yml](../.github/workflows/ci.yml) still runs on PRs and on push to `main`. Vercel's deploy runs in parallel; a green CI run does not gate Vercel and vice versa. If CI fails on a `main` push, revert the offending commit; do not rely on Vercel to catch it.

---

## 6. Pre-production gates

Before flipping the Vercel project's production deployment toggle for the first time, the following manual gates from Phase 5 must clear:

- [ ] **Screen-reader smoke** — VoiceOver (macOS / iOS) or NVDA (Windows) walks the three routes (Home, Course overview, Lesson reader). Checks:
  - Skip link announces and works.
  - Headings are read in logical order.
  - Sidebar accordion announces expanded / collapsed state.
  - "Mark as completed" announces state change.
  - Mobile lesson drawer traps focus and announces open / close.
  - Icon-only buttons (close, prev/next) have accessible names — not just "button".
- [ ] **Editorial review of seed lessons** — The 6 authored lessons in [packages/content/src/courses/istorija-srbije-365/lessons/authored/](../packages/content/src/courses/istorija-srbije-365/lessons/authored/) (Days 1, 7, 31, 106, 200, 305) reviewed by a Serbian historian for:
  - Historical accuracy (dates, names, claims).
  - Tone fit for the Editorial direction.
  - Serbian language quality (idiom, register, ćirilica/latinica consistency).
  - No subtle bias or contested framings stated as fact.

Both gates are content / accessibility quality bars, not engineering work. They are tracked here so the deploy procedure cannot accidentally bypass them.

---

## 7. Custom domain

V1 ships on the Vercel project subdomain (e.g. `learn365-web.vercel.app`). When a custom domain is registered:

1. Add the domain in the Vercel project's **Domains** tab.
2. Vercel issues the exact DNS records to add at the registrar (apex `A` + `CNAME` for `www`, or a single `CNAME` for a subdomain).
3. Wait for DNS propagation + automatic TLS issuance via Let's Encrypt.
4. Update any docs / share-links / Open Graph metadata that hard-code the old hostname.

The product brand surfaces are History 365 / Istorija 365, so a domain like `istorija365.rs`, `history365.app`, or similar fits the brand. Domain selection is not yet decided.

---

## 8. Rollback

Vercel preserves every deployment indefinitely. To roll back:

1. Open the Vercel project → **Deployments**.
2. Find the last good deploy.
3. **Promote to Production**.

A bad deploy on `main` does **not** require a Git revert — promote the previous deploy first to restore service, then fix forward in a PR. Reverting in Git triggers a new deploy that will also need to succeed; promote-then-revert is the safer order.

---

## 9. Future: migration to Azure

Placeholder, not a commitment. Vercel remains the v1 default.

If we later migrate the web app to Azure (for tenant alignment with the .NET backend or cost reasons), the moving parts are:

- **Likely host**: Azure Static Web Apps (Next.js standalone build) or Azure App Service running a Linux container. Container Apps is overkill for a static-leaning frontend.
- **Build pipeline**: GitHub Actions workflow replacing Vercel auto-deploy — same `apps/web` build artefact, pushed to Azure via the standard `azure/webapps-deploy` or SWA action.
- **Env vars** move from Vercel project settings to App Service / SWA configuration.
- **Custom domain + TLS** re-issued via Azure-managed certificates.
- **Preview deploys** lose Vercel's per-PR magic; we'd add a GitHub Actions job that builds and deploys to a slot or a SWA preview environment.

Backend (Phase 8) provisions Azure SQL + App Service / Container Apps for the API regardless of where the web app lives.

---

## 10. Status

| Step | Status |
|---|---|
| Plan documented (this file) | done |
| Manual gates cleared (§6) | pending |
| Vercel project created | pending |
| First production deploy | pending |
| Custom domain | deferred to post-v1 |
