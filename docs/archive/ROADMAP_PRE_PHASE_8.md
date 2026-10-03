# Pre-Phase-8 Roadmap — Closing the Premium-Daily Gap

**Status:** Draft, awaiting owner confirmation of sequence.
**Date:** 2026-05-19
**Predecessors:**

- Phase 7.4 — Eras as editorial blocks (merged 2026-05-19, PR #16).
- [`HANDOFF.md`](../../HANDOFF.md) — current live forward-looking pointer.
- [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md) — Current Baseline.

**Source:** Independent mobile UI/UX assessment conducted 2026-05-19 against
the screenshot pack at `screenshots/mobile/` and the live build at
`https://learn365-web.vercel.app/`.

## Why this roadmap exists

The post-7.4 build is the new visual baseline. The assessment found the
visual chrome is already premium-feeling, but several non-visual gaps stand
between the current state and a credible paid daily-history product:

- A navigation bug on mobile (TopBar drops every text link at ≤720px, so
  the Course overview is unreachable from the global chrome).
- The daily-ritual premise is not stated anywhere on first screen.
- Four overlapping progress signals on the course overview (capsule, ring,
  Aktuelno row, Sledeće row, era count, section count) with no canonical
  hierarchy.
- No trust scaffolding inside the lesson reader (no sources, no byline, no
  last-reviewed date).
- No comfort affordances inside the lesson reader (no scroll progress, no
  bookmark, no reading-position cue).
- The 6 authored lessons render with no figures.

Each of these is a separable phase bundle. None require backend, auth, or
native mobile — all of them fit the existing local-state + `ProgressStorage`
swap seam, so they are compatible with the future Phase 8 (.NET API) without
rewrite.

## Locked owner decisions

Captured during planning 2026-05-19:

- **R1 — Bundle A ships first.** Mobile global nav restoration is the
  navigation-bug-class item and unlocks every subsequent mobile flow.
- **R2 — Bundle B uses since-you-started counter framing.** "Tvoj 3. dan",
  not real-calendar dates. Calendar dates can be reconsidered post-Phase 8
  when timezone-aware backend sync exists.
- **R3 — Roadmap lives here in `docs/`,** not just in conversation. Per-bundle
  detailed plans get their own `PHASE_X_Y_PLAN.md` and are written one at a
  time, on owner green-light, so they don't go stale.

## Phase numbering

The two existing 7.x backlog items (`HANDOFF.md` Pre-Phase-8 candidates)
are preserved as-is. The new bundles slot in after them. **Phase number ≠
ship order** — sequencing is set in the "Ship order" section below.

| Phase | Title | Source |
| --- | --- | --- |
| 7.5 | Mobile lesson sticky chrome scroll-collapse | Existing backlog |
| 7.6 | Course page scroll restore | Existing backlog |
| 7.7 | Mobile global nav restoration | This roadmap, Bundle A |
| 7.8 | Daily ritual anchor on Home | This roadmap, Bundle B |
| 7.9 | Progress narrative consolidation | This roadmap, Bundle C |
| 7.10 | Lesson trust scaffolding (sources + byline + last-reviewed) | This roadmap, Bundle D |
| 7.11 | Lesson reading comfort (scroll progress + bookmark) | This roadmap, Bundle E |
| 7.12 | Authored lesson editorial pass (figures + sources) | This roadmap, Bundle F |

## Ship order (locked R1, indicative for the rest)

1. **Phase 7.7** — Mobile global nav restoration. **First. Owner-locked.**
2. **Phase 7.8** — Daily ritual anchor (highest retention impact, small effort).
3. **Phase 7.9** — Progress narrative consolidation (clarity blocker).
4. **Phase 7.10 + 7.12 as one editorial PR window** — sources + byline +
   figures across the 6 authored lessons (single content pass, lowest
   churn on the schema).
5. **Phase 7.11** — Reading comfort (scroll progress + bookmark).
6. **Phase 7.5 + 7.6** — Polish backlog, before declaring web v1 visually
   complete and starting Phase 8.

Owner can re-sequence 7.8–7.12 after Phase 7.7 ships if review changes the
priority signal.

## Bundle summary

Each entry below is the planning seed. The detailed `PHASE_X_Y_PLAN.md` is
written one bundle at a time, on owner green-light, mirroring the 7.4 plan
structure (locked decisions → file-level bundle → verification → risks).

### Phase 7.7 — Mobile global nav restoration (Bundle A)

- **Goal.** Restore a mobile-reachable path from the global chrome to the
  Course overview. Today `TopBar.module.css:108` hides every text nav link
  at ≤720px, leaving only Brand → Home + the progress capsule.
- **Scope.** Keep "Kurs" visible on mobile in the TopBar. Two viable shapes
  (locked decision pending in the detailed plan):
  - (a) Keep `Kurs` text link in TopBar on mobile, drop `Početna` (Brand is
    the Home affordance) and `O aplikaciji` (footer carries it).
  - (b) A tiny bottom tab bar `Početna · Kurs · Više` ≤720px.
- **Out of scope.** No new routes, no hamburger, no menu drawer.
- **Files likely touched.** `packages/ui-web/src/primitives/TopBar/*`,
  `apps/web/e2e/smoke.spec.ts` (new mobile-reachability assertion).
- **Effort.** Half-day.
- **Definition of done.** Mobile user reaches `/course/...` from header on
  every route; Playwright asserts on `chromium-mobile`.

### Phase 7.8 — Daily ritual anchor on Home (Bundle B)

- **Goal.** Make the daily-lesson premise explicit on the first screen.
  Reframe Home from "course catalog" to "daily ritual" without changing the
  content model.
- **Scope.** A new state-aware block above the recommended-lesson card on
  Home. Copy register (per R2 since-you-started counter):
  - Idle: "Spreman si da počneš. Dan 001 čeka."
  - Mid-course: "Tvoj 3. dan · sledeća lekcija: Dan 007."
  - Done-today: "Današnja lekcija je gotova. Vidimo se sutra."
  Also: an explicit "365 lekcija · 1 dnevno · ~8 minuta" structural caption
  near the hero so the daily contract is stated, not encoded.
- **State source.** "Tvoj N. dan" counter = `completedCount + (lastOpened &&
  !lastOpenedCompleted ? 1 : 0)`. No real calendar dependency. No
  `startDate` storage. No timezone math.
- **Out of scope.** Streaks (V1 exclusion in `CLAUDE.md`). Push
  notifications. Real-calendar dates. Onboarding wizard.
- **Files likely touched.** `apps/web/app/_components/HomeDailyAnchor.tsx`
  (new), `apps/web/app/page.tsx`, `apps/web/app/page.module.css`. Possibly
  a small selector helper in `@learn365/core`.
- **Effort.** 1 day.
- **Definition of done.** Three Playwright snapshots: fresh, mid-course,
  done-today.

### Phase 7.9 — Progress narrative consolidation (Bundle C)

- **Goal.** End the four-counter situation on the course overview. Settle
  on one canonical hierarchy.
- **Scope.** Course-overview progress card rebuilt around one narrative.
  Proposed (decision pending in detailed plan):
  - TopBar capsule = the global counter (unchanged).
  - Course overview = ring + a single "Trenutno: Dan 007 · {title} → Otvori"
    line. The dual "Aktuelno / Sledeće" rows collapse to one.
  - Per-era count and section count stay as inline meta but lose visual
    weight (drop the chip, keep the number).
- **Out of scope.** No data model changes. No selector changes in
  `@learn365/core`. Pure UI consolidation.
- **Files likely touched.** `packages/ui-web/src/course/CourseProgress/*`,
  `apps/web/app/course/[courseId]/_components/CourseOverviewProgress.tsx`,
  `packages/ui-web/src/course/CourseCard/*` (de-emphasize per-era count
  chip).
- **Effort.** 1 day.
- **Definition of done.** First-time user opens `/course/...` and sees one
  obvious "where am I" line, not six.

### Phase 7.10 — Lesson trust scaffolding (Bundle D)

- **Goal.** Lay the credibility floor a paid Serbian-history product needs.
- **Scope.** Three additions to the content model and the lesson reader:
  1. `Lesson.byline?: { author?: string; reviewer?: string }` rendered as a
     small mono caption under the lesson title.
  2. `Lesson.lastReviewedAt?: ISODate` rendered next to the byline.
  3. `Lesson.sources?: Source[]` rendered as a closing `## Izvori` editorial
     block. `Source = { kind: 'book' | 'article' | 'museum' | 'archive';
     title; author?; year?; url? }`.
- **Out of scope.** Per-paragraph footnotes (post-MVP). External link
  previews. A separate `/izvori` index route. Backfilling sources on
  placeholder lessons.
- **Files likely touched.** `packages/content/src/types.ts` (schema),
  `packages/content/src/courses/.../validate.ts` (rules — sources required
  on authored lessons), 6 authored lesson files (data only),
  `packages/ui-web/src/lesson/{LessonHeader, LessonReader, LessonSources}/*`.
- **Decisions to lock in detailed plan.** (1) Byline copy default —
  generic `Tim History 365` until named editors exist? (2) Sources required
  on authored or optional?
- **Effort.** 1.5–2 days.
- **Definition of done.** Every authored lesson ends with a visible `Izvori`
  block; validator fails CI if an authored lesson has no sources.

### Phase 7.11 — Lesson reading comfort (Bundle E)

- **Goal.** Make long lessons comfortable on 390px screens.
- **Scope.** Two additions:
  1. **Reading progress.** A 2-px hairline at the very top of the article
     that fills as the user scrolls. A `ReadingProgress.tsx` stub already
     exists at `apps/web/app/course/[courseId]/lesson/[lessonId]/` — wire
     it.
  2. **Bookmark toggle.** Icon-only toggle on the lesson header, keyed to
     localStorage via a new `BookmarkStorage` adapter that mirrors
     `ProgressStorage` (same swap-seam pattern). A "Sačuvane lekcije"
     surface on the course overview lists them.
- **Out of scope.** Highlights / notes (post-MVP). Cross-device sync (waits
  for Phase 8 backend).
- **Files likely touched.** `apps/web/app/.../ReadingProgress.tsx`
  (complete the stub), `packages/core/src/bookmarks/*` (new),
  `packages/ui-web/src/lesson/LessonHeader/*`,
  `packages/ui-web/src/icons/IconBookmark.tsx` (new), course overview
  bookmark list.
- **Effort.** 1.5 days.
- **Definition of done.** User can mark/unmark a lesson; persists across
  reloads; bookmarks list shows them.

### Phase 7.12 — Authored lesson editorial pass (Bundle F)

- **Goal.** Add 1–2 figures per authored lesson. The content model already
  supports a `figure` block but no figure appears in the rendered authored
  lessons.
- **Scope.** Editorial pass + figure insertion across 6 authored lessons.
  Public-domain or Creative Commons only; attribution rendered in the
  caption. Pair with Phase 7.10 in one editorial PR window so sources +
  figures land together.
- **Out of scope.** New lesson authoring. Image CDN / hosting infra (keep
  assets in `apps/web/public/lessons/` for v1).
- **Files likely touched.** 6 authored lesson files,
  `apps/web/public/lessons/*` (image assets),
  `packages/ui-web/src/lesson/LessonBody/*` (verify the figure block
  renders well on mobile — today it is a placeholder, per
  `COMPONENT_LIBRARY.md`).
- **Decisions to lock.** Image curation owner; caption register; WebP
  target dimensions.
- **Effort.** 2 days for code + design. Image curation is the schedule
  risk.
- **Definition of done.** Every authored lesson carries at least one
  figure; mobile snapshot reads editorial, not Wikipedia-ish.

## Out of scope for this roadmap

These are real opportunities surfaced by the assessment, but they sit
outside V1 per `CLAUDE.md` or require Phase 8+ infrastructure:

- Streaks (calendar visualization).
- Push notifications / email reminders.
- Audio narration of lessons.
- Reading personalization (font size / paragraph spacing controls).
- Notes / highlights synced to backend.
- Per-era maps.
- Printable / PDF keepsake.
- Quizzes / recall checks.
- Onboarding flow as a separate route. Phase 7.8 handles the daily-contract
  framing inline; a full onboarding wizard belongs post-MVP.

## Total effort estimate

Roughly **9–12 working days** of focused implementation across all bundles,
plus image curation for 7.12 as the schedule risk. None of these require
backend, auth, or native mobile.

## How to proceed

1. **Owner reviews this roadmap** and confirms or re-sequences the ship
   order in the section above.
2. **Detailed plan for Phase 7.7** (Bundle A) is written next, mirroring
   the 7.4 plan template, with the (a) vs (b) decision locked.
3. **One phase at a time** — the next detailed plan is only written after
   the previous phase merges, so plans don't go stale.
4. **After each merge** — `PROJECT_STATE.md` gains a "Phase 7.x — done"
   section, `HANDOFF.md` refreshes the next-step pointer, the merged
   `PHASE_X_Y_PLAN.md` moves into `docs/archive/phases/`.
5. **When 7.5–7.12 are all done** (or the owner declares the remaining
   items optional) the roadmap is considered consumed and the project
   continues with Phase 8 (.NET backend) per
   [`docs/BACKEND_STRATEGY.md`](../BACKEND_STRATEGY.md).

## What this roadmap is NOT

- **Not a redesign.** Every bundle preserves the Editorial visual identity
  declared as the new floor in `PROJECT_STATE.md` § Current Baseline.
- **Not a content rewrite.** The 6 authored lessons get sources and figures
  added; their existing text is unchanged.
- **Not a backend feature wave.** All work fits the existing local-state +
  `ProgressStorage` swap seam.
- **Not an onboarding wave.** Phase 7.8 makes the daily contract explicit
  inline; no wizard, no auth, no first-run flow.
