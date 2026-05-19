# Handoff — History 365 / Istorija Srbije 365

**Last updated:** 2026-05-19, after Phase 7.7 merge (PR #17, commit `2c8de8d`).

This is the live forward-looking pointer for the project. **Read this before starting any new phase.** It tells you what is true now and what the strongest next moves are.

For the full current state, read [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — the "Current Baseline" section at the top is the do-not-regress floor.

---

## Where the app is right now

- **Web v1 is live** at https://learn365-web.vercel.app/ (Vercel project `learn365-web`, auto-deploys from `main`).
- **Phase 7.7 just shipped** — the mobile TopBar keeps the `Kurs` text link visible on ≤720px so the course overview stays reachable from the global chrome. Brand still carries Home; footer still carries `O aplikaciji`. Mobile masthead reads: Brand · Kurs · ProgressCapsule.
- **UI/UX is at a stable baseline** the owner has declared the new floor. Do not regress below this state without an explicit owner decision.
- **No backend.** Progress lives in `localStorage` via the `ProgressStorage` adapter in `@learn365/core` — the swap seam for the future .NET API.
- **No native mobile.** Responsive web only; `MobileLessonDrawer` is the mobile reading surface.

For the detailed surface-by-surface baseline (TopBar, Home, Course, Lesson reader, mobile, content loading, technical stack), see `docs/PROJECT_STATE.md` → "Current Baseline — 2026-05-19".

---

## Carry-forward, non-blocking deferrals

Open since Phase 5. None of these block new feature phases, but all should close before web v1 is declared "complete":

- **Production contact email** — swap the `CONTACT_EMAIL` placeholder in [`apps/web/app/o-aplikaciji/_copy.ts`](apps/web/app/o-aplikaciji/_copy.ts) once the real address exists. One-line change.
- **Screen-reader smoke** — VoiceOver / NVDA on TopBar nav + breadcrumbs + accordion + completion toggle. Manual gate from Phase 5.
- **Editorial review of the 6 authored seed lessons** ([`packages/content/src/courses/istorija-srbije-365/lessons/authored/`](packages/content/src/courses/istorija-srbije-365/lessons/authored/)) for historical voice, accuracy, and period coverage. Manual gate from Phase 5.

---

## Pre-Phase-8 UX backlog

The post-7.4 backlog was reframed on 2026-05-19 after an independent mobile UI/UX assessment. The full roadmap is now in [`docs/ROADMAP_PRE_PHASE_8.md`](docs/ROADMAP_PRE_PHASE_8.md) and supersedes the prior `NEXT_PHASE_RECOMMENDATION.md` picks. Six bundles surfaced as Phases 7.7–7.12; the two pre-existing 7.5/7.6 polish items are preserved.

**Next pick: Phase 7.8 — Daily ritual anchor on Home.** Detailed plan is drafted in [`docs/PHASE_7_8_PLAN.md`](docs/PHASE_7_8_PLAN.md). Decisions D1–D4 locked. Awaiting owner green-light to implement.

Remaining candidates, in proposed ship order (per roadmap, owner can re-sequence):

- **Phase 7.8 — Daily ritual anchor on Home.** New state-aware "Tvoj N. dan" block + replace the chronological caption with the daily contract `365 lekcija · 1 dnevno · ~8 minuta`. Two-state model (idle + in-progress), no real-calendar dependency. Highest retention impact, ~1 day.
- **Phase 7.9 — Progress narrative consolidation.** End the four-counter overlap on the course overview; settle on one canonical hierarchy. ~1 day.
- **Phase 7.10 + 7.12 (combined editorial PR window) — Trust scaffolding + figures.** Per-lesson `Lesson.byline`, `lastReviewedAt`, `sources[]`; add figures to the 6 authored lessons. ~3–4 days plus image curation.
- **Phase 7.11 — Reading comfort.** Wire `ReadingProgress.tsx` (stub already exists) + add a bookmark toggle with a new `BookmarkStorage` adapter mirroring `ProgressStorage`. ~1.5 days.
- **Phase 7.5 — Mobile lesson sticky chrome scroll-collapse.** Existing polish backlog item.
- **Phase 7.6 — Course page scroll restore.** Existing polish backlog item.
- **Hero backdrop QA pass** at 360 / 768 / 1280 / 1920. One-off check, not a phase.

---

## Roadmap continuation after the UX backlog closes

Once the remaining UX backlog is closed (or the owner declares web v1 visually approved), the roadmap continues with:

1. **Phase 8 — Backend (.NET 9 Web API + SQL Server + EF Core).** Plan: [`docs/BACKEND_STRATEGY.md`](docs/BACKEND_STRATEGY.md). The `ProgressStorage` adapter in `@learn365/core` is the swap seam — no v1 frontend rewrite required when the backend lands. `apps/api/` does not yet exist; it is introduced in this phase.
2. **Phase 8b — Native mobile (Expo).** Plan: [`docs/MOBILE_NOTES.md`](docs/MOBILE_NOTES.md). Built after backend so the mobile app can sync progress remotely. `apps/mobile/` and `packages/ui-mobile/` do not yet exist; they are introduced in this phase.

The web v1 codebase has been built with both swap seams already in place — backend via `ProgressStorage`, mobile via the `ui` / `ui-web` token-vs-component split. Neither phase should require rewriting v1 code.

---

## How to plan the next phase

1. **Walk the live build** — local `pnpm dev` or the Vercel preview. Use the desktop and mobile breakpoints. Trust the live read over any archived audit.
2. **Pick one bundle.** A phase is one PR with 1–4 commits, each one shippable in isolation. Phases that ship as feature bundles (7.0a–e, 7.2a–f, 7.4a–c) have been the cleanest unit.
3. **Write the plan as `docs/PHASE_X_Y_PLAN.md`.** Predecessor references, locked decisions, file list, gates, screenshot review plan. The Phase 7.4 plan (now in `docs/archive/phases/`) is a good template.
4. **Get owner sign-off on locked decisions** before writing production code. The "plan before code" discipline is in place — do not skip it.
5. **Ship**, then add a "Phase X.Y — done" entry to `docs/PROJECT_STATE.md` and move the plan file from `docs/` into `docs/archive/phases/` once merged.
6. **Update this `HANDOFF.md`** so the next session starts with current context.

---

## What NOT to do

- **Do not rebuild any of the baseline surfaces from scratch.** The current UI/UX is the new floor.
- **Do not start a new authentication, payments, or backend feature** without explicit owner direction — those are all v1-exclusions.
- **Do not consult `docs/archive/`** for current state. Archived plans describe the situation at the time they were written and are kept for archaeology only.
- **Do not edit production code as part of doc-only work.** Documentation passes should leave the working tree clean of code changes.
