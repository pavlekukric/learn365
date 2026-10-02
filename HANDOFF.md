# Handoff — Istorija 365 / Istorija Srbije 365

**Last updated:** 2026-10-02 — **Phase 22 done:** fonts back to the mobile floor (review 2026-10-01 P1 item 3; PROJECT_STATE → "Phase 22"). Earlier, 2026-10-01 night — **Phase 20 done:** second-source pass on all 154 ⚠ items (138 confirmed, 3 corrected) and a third, deeper pass that closed the 13 open items and the side findings — [`docs/review/druga-provera/README.md`](docs/review/druga-provera/README.md). Earlier: **Phase 18 done:** a user-side walk of the live site (8 / 10) and its first four fixes — era names, Home for a returning reader, the mobile lesson header, the drawer's close row (PROJECT_STATE → "Phase 18"). **Phase 17 done:** the whole engineering backlog of [`docs/PRODUCT_REVIEW_2026-09-30.md`](docs/PRODUCT_REVIEW_2026-09-30.md) (P0, P1 items 7–10, P2 items 12–19, the owner-approved parts of P3 item 20) shipped overnight as PRs #60–#65, each squash-merged on green CI and rolled out. What is true now: [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) → "Current Baseline" and "Phase 17". The previous, much longer version of this file is [`docs/archive/HANDOFF_2026-09-29.md`](docs/archive/HANDOFF_2026-09-29.md) (history only).

## Where the app is right now

- Live at https://istorija365.com/ — brand **Istorija 365**, 365 lessons, Google sign-in + cloud progress, owner-only `/pregled`.
- Every gate runs in CI before a deploy: content drift, lint (incl. hooks + a11y in `apps/web` and `packages/ui-web`), typecheck, Vitest, build, bundle budget, Playwright Chromium desktop + mobile, axe, and an accounts-on suite. Firefox + WebKit run nightly.
- Deploys roll out only the tip of `main`; a release that does not become healthy (or whose migrations do not apply, once the new `deploy.sh` is on the box) rolls back by itself.

## Owner steps — only you can do these (none blocks the site)

The Claude Code auto-mode policy refuses remote shell writes on the VPS, so these stay with you. Every command is in [`docs/DEPLOY.md`](docs/DEPLOY.md).

1. **Deploy key + `.env` (§13a, ~5 min, do first).** Add the laptop key to `deploy` if it is not there, then steps 1–5 of §13a. If you already applied 13a earlier with the old `no-pty` prefix, run step 2b. Step 4 must answer `exit 255` (forwarding refused); step 5 must print `600 deploy`.
2. **Copy the new box scripts (§9, the "Ops set" row).** As `deploy`: `deploy/deploy.sh` and `deploy/backup.sh` → `/srv/learn365/` (keep `*.bak-<date>`), `chmod +x`, `bash -n`. Order against the image does not matter.
3. **Off-box backup + one restore test (§10).** Hetzner Backups were switched on 2026-10-01 (7 daily images of the whole server, Računi included — DEPLOY §10), so losing the VPS is covered; what is left is optional: a copy outside Hetzner (OneDrive: a Windows scheduled task on the laptop that pulls the nightly dump over `ssh vps`, or `BACKUP_OFFBOX_TARGET=rclone:onedrive:…` on the box) and the restore test. If wanted: pick a destination (an rclone remote with encryption is recommended — the dumps hold names and e-mail addresses), set `BACKUP_OFFBOX_TARGET` in `/srv/learn365/.env`, run `backup.sh` once, then the restore test into a scratch database and note the date in §9.
4. **Cloudflare rate limit on `/api/` (§13b).** Dashboard only.
5. **Rotate the Google client secret** (it was pasted in chat on 2026-09-27): Google Cloud → Clients → Reset secret → `/srv/learn365/.env` → `dc.sh up -d web`.
6. **Name the data controller on `/privatnost`.** It still says "privatno lice"; the section is `ko-vodi` in `apps/web/app/privatnost/_copy.ts` — a one-line change, tell Claude the name.

## Next pick — the owner's call, nothing is queued

- **Full review 2026-10-01 → [`docs/PRODUCT_REVIEW_2026-10-01.md`](docs/PRODUCT_REVIEW_2026-10-01.md), overall 8 / 10.** Done since: *Always Use HTTPS* (owner, 2026-10-01), Next 15.5.27, Phase 21 (progress tree, resume rule, reader polish, focus/ARIA), Phase 22 (fonts: 2 preloads instead of 12, Serbian-Latin subsets, hero preload, font budget + warn-only Lighthouse in CI). Still open from it: P1 = signed-in sync loss paths, the Day 1 figure, a proofreading pass and a truthful trust layer. The items below are folded into it.

- **Content (the review's biggest remaining risk):** the historian pass is done for all 365 lessons (Phase 19, PRs #68–#76; reports in `docs/review/era-NN-*.md`). The ⚠ items were re-checked against non-Wikipedia sources and every open item was closed (Phase 20, [`docs/review/druga-provera/README.md`](docs/review/druga-provera/README.md)). Still open: a named reviewer + per-era reading lists (trust layer), Day 361 now covers the Novi Sad canopy and the 2024–26 protests but is time-sensitive (revisit after the 25 October 2026 election and the canopy trial), coverage gaps and voice (items 21–22), unused fields (item 23). Editorial work; Claude can prepare drafts lesson by lesson, the owner decides.
- **Manual QA a person has to do:** a screen-reader pass (VoiceOver / NVDA) over TopBar, the era accordion, the completion toggle and the drawer; a look at the site on a real phone after the cascade fix and the font subsets (Phase 22: check č ć đ š ž and „…” in body, UI and the italic brand mark).
- **UI left from the Phase 18 walk (owner's call):** the desktop hero's empty right half, uneven Home era-rail bands, paragraph spacing (default `p` margins on top of the flex gap → ~58 px), the blurry Day 1 figure, the long mobile course overview, the small desktop `Označi kao pročitano`.
- **Engineering left over (small, optional):** English route segments (`/course/…/lesson/…`) → Serbian with redirects; `og:url` on the 404 / account pages still inherits Home (noindex pages); type-aware lint (`strictTypeChecked`) for floating promises; Phase 8b native mobile (plan-before-code).

## How to plan the next phase

1. Walk the live build (desktop + a phone width); trust it over any archived document.
2. One bundle = one PR with 1–4 commits, each shippable alone.
3. Non-trivial work gets a plan (`docs/PHASE_N_PLAN.md`: decisions, files, gates, screenshot plan); the owner signs off before code, unless the owner has authorized a queue (see the memory note / the owner's words).
4. Ship, add a "Phase N — done" entry to `docs/PROJECT_STATE.md` (and adjust its Current Baseline), archive the plan under `docs/archive/phases/`, update this file.

## What NOT to do

- Do not rebuild baseline surfaces from scratch; every change is targeted.
- Do not move the `globals.css` import in `apps/web/app/layout.tsx` below the component imports — the cascade depends on it (Phase 17).
- Payments, subscriptions, streaks, quizzes, CMS stay out of v1. Accounts stay Google-only; no password login, no gated reading, no test-only auth bypass in production code (the accounts e2e seeds session rows into a throwaway PGlite instead).
- Never touch Računi on the shared VPS; never run remote writes on the box from Claude Code — hand the commands to the owner.
- Do not consult `docs/archive/` for current state.
