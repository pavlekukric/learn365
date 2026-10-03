# Handoff — Istorija 365 / Istorija Srbije 365

**Last updated:** 2026-10-03 — **Phase 24 done:** the whole owner-free backlog of the full review [`docs/PRODUCT_REVIEW_2026-10-03.md`](docs/PRODUCT_REVIEW_2026-10-03.md) shipped as PRs #88–#102 (PROJECT_STATE → "Phase 24"): the read-lesson scroll bug, a sync account guard, a lektura of all 365 lessons plus a fact follow-up, a truthful trust layer with a reading-list page, UI / SEO / image polish, and CI / deploy hardening. Earlier phases: PROJECT_STATE. The previous, much longer version of this file is [`docs/archive/HANDOFF_2026-09-29.md`](docs/archive/HANDOFF_2026-09-29.md) (history only).

## Where the app is right now

- Live at https://istorija365.com/ — brand **Istorija 365**, 365 lessons, Google sign-in + cloud progress, owner-only `/pregled`, reading list `/course/istorija-srbije-365/literatura`.
- Every gate runs in CI before a deploy: content drift (incl. `lesson-dates.json`), validate-content with wording rules, lint (incl. hooks + a11y), typecheck, Vitest, build, bundle budget, Playwright Chromium desktop + mobile, axe, and an accounts-on suite; a non-blocking `pnpm audit`. Lighthouse runs on PRs + nightly, off the deploy path; Firefox + WebKit nightly. Dependabot opens weekly PRs.
- Deploys roll out only the tip of `main`; a release that does not become healthy (or whose migrations do not apply) rolls back by itself.

## Owner steps — only you can do these (none blocks the site)

The Claude Code auto-mode policy refuses remote shell writes on the VPS, and Claude's sandbox cannot reach the live site or Wikimedia, so these stay with you. Every box command is in [`docs/DEPLOY.md`](docs/DEPLOY.md).

1. **Copy the new box scripts (§9, the "Ops set" row).** As `deploy`: `deploy/deploy.sh` and `deploy/backup.sh` → `/srv/learn365/` (keep `*.bak-<date>`), `chmod +x`, `bash -n`. The new `deploy.sh` pulls before it writes the tag and rolls back on any error.
2. **Deploy key (§13a, ~5 min).** `authorized_keys` should start `restrict,command="/srv/learn365/ssh-command.sh"`; step 4 must answer `exit 255`.
3. **`Prijavi grešku` address.** GitHub → repo → Settings → Variables → Actions → `REPORT_EMAIL` = the address readers should write to. The next deploy bakes it in; the link stays hidden until then.
4. **Day 1 figure.** `era-1-lepenski-vir.webp` is 1440×1080 in 28.6 kB (soft) and shows a floor close-up that does not match its alt text. Pick a sharper Commons image, export ≥ 1320 px wide, save under a **new file name** (images are cached for a year), and tell Claude the name and attribution — or send the file.
5. **Cloudflare rate limit on `/api/` (§13b).** Dashboard only.
6. **Off-box backup + one restore test (§10), optional.** Hetzner Backups cover losing the VPS; the off-box copy now prunes to 14 dumps.
7. **Look at it as a reader:** a screen-reader pass (VoiceOver / NVDA) over TopBar, the era accordion, the completion toggle and the drawer; the site on a real phone; a production Lighthouse run (Home, overview, Day 1) to confirm the local 92–97.
8. **Content decisions (listed in [`docs/review/lektura/`](docs/review/lektura/README.md)):** Day 361 after the 25 October 2026 election; the 1900/1910 literacy figure (Days 262 / 278 give 16–20 %); Prince Aleksandar's first burial place (232); Jovan vs Ivan Kapistran (chosen: Jovan).

Declined by the owner (2026-10-01), kept for the record: rotating the Google client secret, naming the data controller on `/privatnost`.

## Next pick — the owner's call, nothing is queued

- **Editorial (biggest remaining lever, review 2026-10-03 P3 20):** coverage by swapping lessons (Tesla, Pupin, Milanković, Nevesinje, Gazimestan; Vuk and Njegoš own lessons; women after 1400; Day 360 is a weak catalogue, 105 / 194–195 overlap), and the one-template voice (one H2 per lesson, „Kada…” openings, primary-source quotes). Claude can draft lesson by lesson; the owner decides.
- **A named reviewer** — then `byline.reviewer` + `lastReviewedAt` per lesson (the loader already enforces the pair).
- **Engineering left (small):** Serbian route segments with 308 redirects (`lessonHref()` is in place); per-era share cards; sync ordering across devices (per-id timestamps); session hygiene (end old sessions on re-login, absolute lifetime, "sign out everywhere"); the desktop hero's empty right half; Phase 8b native mobile (plan-before-code).

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
