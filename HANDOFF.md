# Handoff — History 365 / Istorija Srbije 365

**Last updated:** 2026-05-19, after Phase 7.9 merge (PR #19, commit `d34a6eb`).

This is the live forward-looking pointer for the project. **Read this before starting any new phase.** It tells you what is true now and what the strongest next moves are.

For the full current state, read [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — the "Current Baseline" section at the top is the do-not-regress floor.

---

## Where the app is right now

- **Web v1 is live** at https://learn365-web.vercel.app/ (Vercel project `learn365-web`, auto-deploys from `main`).
- **Phase 7.9 just shipped** — the course-overview progress card collapsed from six overlapping signals to one canonical row. The `Sledeće` row and the `N / 365 završeno` ring caption are gone; the row's eyebrow now speaks the same journey-day register as Phase 7.8's Home anchor (`TVOJ N. DAN` mid-course, `ZAPOČNI` idle). The per-era `u toku` accent chip on `CourseCard` is retired. Net **−39 LOC**, deletion-heavy.
- **Phase 7.8 + full-content corpus** is the prior milestone. Home carries the state-aware "Tvoj N. dan" daily-ritual anchor; hero caption is `365 lekcija · 1 dnevno · ~8 minuta`; `validate-content` reports **365 authored / 0 placeholder** (was 5 / 360). Schema gained `subtitle`, `dateLabel`, `timelinePosition`, `summary`, `keyPeople`, `keyPlaces`; paragraph blocks may carry `dropcap: true`.
- **Codegen pitfall to know:** the runtime reads `packages/content/src/courses/istorija-srbije-365/_generated.ts`. Anyone editing `content/courses/*.json` must run `pnpm gen-content` to refresh the generated file — otherwise the app shows stale content.
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

The post-7.4 backlog was reframed on 2026-05-19 after an independent mobile UI/UX assessment. The full roadmap is in [`docs/ROADMAP_PRE_PHASE_8.md`](docs/ROADMAP_PRE_PHASE_8.md). Six bundles surfaced as Phases 7.7–7.12; the two pre-existing 7.5/7.6 polish items are preserved. **Phases 7.7 (mobile nav), 7.8 (daily anchor), and 7.9 (progress consolidation) have shipped**; the rest remain.

**Next pick: Phase 7.10 + 7.12 as one editorial PR window** — Trust scaffolding + figures. Per-lesson `Lesson.byline`, `lastReviewedAt`, `sources[]`, plus 1–2 figures across the authored lesson set. Now applies to all 365 lessons (not just the original 6), so the scope grows — revisit the bundle sizing on green-light. The `keyPeople` / `keyPlaces` fields from the corpus authoring may already serve part of the trust scaffolding job; the detailed plan should audit overlap before duplicating. Effort: 1.5–2 days code + image curation as schedule risk. Roadmap §D + §F.

Remaining candidates after 7.10/7.12, in proposed ship order (per roadmap, owner can re-sequence):

- **Phase 7.11 — Reading comfort.** Wire `ReadingProgress.tsx` (stub already exists at `apps/web/app/course/[courseId]/lesson/[lessonId]/`) + add a bookmark toggle with a new `BookmarkStorage` adapter mirroring `ProgressStorage`. ~1.5 days.
- **Phase 7.5 — Mobile lesson sticky chrome scroll-collapse.** Existing polish backlog item.
- **Phase 7.6 — Course page scroll restore.** Existing polish backlog item.
- **Hero backdrop QA pass** at 360 / 768 / 1280 / 1920. One-off check, not a phase.

**Quality-of-life candidate surfaced by 7.8:** auto-regen `_generated.ts` on JSON edit (husky pre-commit, a `prebuild` script, or a Turbo input dependency). The current manual `pnpm gen-content` step is a foot-gun if an author edits JSON without remembering to regen. Not a UX phase, but worth a small commit before the next content edit cycle.

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
