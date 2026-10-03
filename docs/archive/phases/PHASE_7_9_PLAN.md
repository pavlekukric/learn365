# Phase 7.9 — Progress narrative consolidation (PLAN)

**Status:** Locked. Owner confirmed D1–D4 (recommended option in each case) on 2026-05-19; D5 + D6 are uncontroversial and locked as proposed.
**Date:** 2026-05-19
**Predecessors:**

- Phase 7.8 — Daily ritual anchor on Home (merged 2026-05-19, PR #18,
  commit `76f94fe`). The "Tvoj N. dan" framing established on Home is the
  anchor this phase aligns the course overview to.
- Phase 7.7 — Mobile global nav restoration (merged in PR #17). The TopBar
  capsule is now the lone global progress signal on every viewport.

**Parent references:**

- [`docs/ROADMAP_PRE_PHASE_8.md`](../ROADMAP_PRE_PHASE_8.md) — Phase 7.9
  entry (Bundle C). Roadmap proposal: "TopBar capsule = global counter
  (unchanged). Course overview = ring + a single 'Trenutno: Dan 007 ·
  {title} → Otvori' line. The dual 'Aktuelno / Sledeće' rows collapse to
  one. Per-era count and section count stay as inline meta but lose
  visual weight (drop the chip, keep the number)."
- [`HANDOFF.md`](../HANDOFF.md) — current live forward-looking pointer; the
  Phase 7.9 entry restates the consolidation goal.
- Independent mobile UI/UX assessment, 2026-05-19, §4 issue #3 ("Four
  overlapping progress signals on the course overview … with no canonical
  hierarchy").
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — Phase 6.5's locked
  "continue-state is completion-driven, not opened-driven." This phase
  inherits it.

## Why this is the next phase

The post-7.8 build now states the daily contract clearly on Home, but the
moment a user lands on `/course/istorija-srbije-365` the screen presents
**six different progress signals competing for the same job:**

1. **TopBar capsule** — `xxx / 365` + thin bar. Global counter.
2. **`CourseProgress` ring** — big circular ring showing `xx%` inside.
3. **`CourseProgress` ring meta** — `N / 365 završeno` text under the ring.
4. **`CourseProgress` "Aktuelno" row** — kicker (`ZAPOČNI` / `NASTAVI`) +
   era label + reading time + title + `DAN nnn` badge.
5. **`CourseProgress` "Sledeće" row** — kicker (`SLEDEĆE`) + next-uncompleted
   title + `DAN nnn` badge. Hidden in idle state, visible mid-course.
6. **Per-era `CourseCard`** — `done / total` count + accent `"u toku"` chip
   on the current era + `ProgressBar`. ×8 cards.

Plus, inside the era accordion: each section row shows either `N lekcija`
(idle) or `done / total` (in-progress). That's a 7th signal at the section
level for users who expand an era.

There is no canonical hierarchy. The same answer ("where am I?") is given
five different ways above the fold. The independent assessment flagged
this as the second-biggest paid-product risk after the daily-ritual gap
that 7.8 already addressed.

Phase 7.9 settles on **one canonical answer** on the course overview and
demotes the others to supporting metadata. No data-model change. No
storage change. No new routes. One PR, one or two small commits.

---

## 1. Locked decisions

These are the load-bearing calls. Confirmed by the owner on 2026-05-19
before any production code was written.

### D1 — Align the canonical row's eyebrow with Phase 7.8

The single canonical "where am I" row on the course-overview progress
card uses the **same journey-day eyebrow** that Phase 7.8 introduced on
Home:

- **Idle (`completedCount === 0`):** eyebrow reads `ZAPOČNI` (no journey
  counter — same rule as the Home anchor).
- **In-progress (`completedCount > 0`):** eyebrow reads
  `TVOJ {N}. DAN` where `N = Math.min(completedCount + 1, 365)`. Exactly
  the same formula `HomeDailyAnchor.tsx` uses today.

The body of the row is the literal lesson identity: the lesson title
plus a right-aligned `DAN nnn` day badge. The whole row is one
`<Link>` to `/course/.../lesson/{currentLessonId}`, preserving
middle-click / right-click semantics — same pattern as the existing row.

Why align with 7.8: Home and Course are the two screens a returning user
sees most. Speaking the same daily-ritual register on both ("Tvoj 4. dan")
turns a navigation surface into part of the journey narrative, instead of
a second, slightly-different counter. It also means the eyebrow on the
course overview is **journey state**, not lesson state — the lesson
identity moves down into the title + day badge below the eyebrow.

Alternative considered: keep the existing `ZAPOČNI` / `NASTAVI` kickers.
Rejected because `NASTAVI` is action-oriented, redundant with the row's
arrow affordance, and doesn't carry the daily-journey framing 7.8 just
shipped.

### D2 — Drop the "Sledeće" row entirely

The `nextLesson` prop on `CourseProgress`, the `nextHref` prop, and the
parallel `SLEDEĆE` row are removed.

Rationale: the row's job is "what comes after the current lesson?" and
that is answered three other ways already — by the era accordion below,
by the prev/next navigation inside the lesson reader, and by the sidebar
on the reader page. On the course-overview card it adds visual weight
without resolving a real user question — once the user opens the current
lesson, the next one is one tap away.

The "Sledeće" row was originally introduced when the card was the only
in-app way to glimpse what came next. Post-7.7 mobile nav and the
expanded era cards, that role is gone.

### D3 — Keep the ring; drop the `N / 365 završeno` ring meta

The big `ProgressRing` with `xx%` inside it stays. It's the editorial
centerpiece of the card.

The small mono caption `N / 365 završeno` directly under the ring is
removed. It duplicates the TopBar capsule (which shows `xxx / 365` plus
the thin bar, always visible above the page) and the ring's own `xx%`
glyph. One number, not three, for "completion total".

Alternative considered: drop the `%` inside the ring, keep the
`N / 365 završeno` meta. Rejected because the ring without a glyph reads
as decoration; the `%` is what makes the ring a chart.

### D4 — Drop the `"u toku"` Chip on `CourseCard`, keep the count

On `CourseCard`, the accent `Chip variant="accent"` reading `"u toku"`
that appears next to `N / total` when `isCurrent` is true is removed.

The current era already visually self-identifies via three other signals:
the title color shifts to `--accent-ink` (`.current .title`), the
`ProgressBar` shows non-zero fill, and the `N / total` count is
greater-than-zero. A green pill that says "u toku" adds nothing new and
contributes to the count-of-counters problem at the page level.

Per-era `done / total` count stays exactly as today. Roadmap §C calls
this out explicitly: "drop the chip, keep the number".

### D5 — Leave section accordion row meta alone

The per-section meta inside an opened era (the right-side text on each
section row: `N lekcija` when idle, `done / total` when in-progress)
**stays as-is**.

Rationale: this signal lives one accordion level down — it's a drill-down
detail, not a top-level competing counter. Users who never expand an era
never see it. Touching it would expand the blast radius of this phase
into the accordion logic for no real consolidation gain.

This decision is the smallest one in the bundle but worth stating
explicitly so the implementation doesn't drift.

### D6 — One PR, one or two small commits

Mirrors 7.7's / 7.8's cadence. Proposed split if commits get large:

- **7.9a:** `CourseProgress` primitive — drop `nextLesson` / `nextHref`
  props, drop the ring meta line, change the eyebrow to journey-day
  framing. Adjust the module CSS.
- **7.9b:** `CourseOverviewProgress` adapter wiring (drop `nextLesson`
  derivation, compute journey-day number, simplify prop shape). Plus
  `CourseCard` — drop the `Chip`, keep the count.

If the changes stay small (likely — this is a deletion-heavy phase),
ship as one commit. Decision deferred to implementation time. Either way:
one PR.

---

## 2. Scope reframe — what 7.9 is, and what it is not

**Phase 7.9 = a deletion-and-relabel pass on the course-overview progress
hierarchy. One canonical "where am I" row, journey-day eyebrow aligned
with Home, plus a quieter `CourseCard` row.**

Held as durable truth for this phase:

- `packages/ui-web/src/course/CourseProgress/` and
  `packages/ui-web/src/course/CourseCard/` are the only ui-web
  components touched. Two folders.
- `apps/web/app/course/[courseId]/_components/CourseOverviewProgress.tsx`
  is the only `apps/web` component that needs to be re-wired (drop the
  next-lesson derivation; pass the journey day).
- Computation of the journey-day number is **identical** to
  `HomeDailyAnchor.tsx`: `Math.min(completedCount + 1, 365)`. The two
  components diverge only on which lesson they link to (Home →
  recommended/last-opened lesson; Course → same `currentLesson` the row
  already resolves today).
- Storage shape (`learn365:progress:v1`) is **not** changed.
- Content model is **not** changed.
- No new selector in `@learn365/core`. The math is two lines and a `min`
  — repeating it once in `CourseOverviewProgress` matches the "three
  similar lines is better than a premature abstraction" rule. If a third
  caller appears (say, a mobile drawer surface in 7.5), revisit then.
- The TopBar capsule is **not** touched. It remains the global telemetry.
- The 8-era timeline on Home is **not** touched.
- The lesson reader, sidebar, drawer, and reader prev/next are **not**
  touched.
- `JumpToDay` is **not** mounted anywhere as part of this phase.

---

## 3. What this phase is NOT addressing

- **Streaks / calendar grids.** Explicit V1 exclusion.
- **Done-today / "you're caught up" framing.** Same calendar-awareness gap
  Phase 7.8 already deferred (no `lastCompletedAt` timestamp). Revisit
  post-Phase 8 when timezone-aware backend sync exists.
- **A `kurs završen` celebration state at `completedCount === 365`.**
  Same reason as 7.8: effectively unreachable in v1 (365 authored lessons
  now exist but no one is realistically completing all of them in a single
  session). Defer the ceremony until real telemetry surfaces a need.
- **TopBar capsule restyling.** The capsule is global; touching it is a
  cross-route change. Out of scope.
- **Section accordion meta.** See D5.
- **`CourseCard` progress bar.** The thin bar stays — it's the
  per-era progress signal, not a competing total counter, and it's the
  affordance that makes an era card feel "in progress" at a glance.
- **`CourseProgress` ring colour / sizing.** Visual is fine; this phase is
  about *what* the card shows, not *how* the ring is drawn.
- **`HomeCurrentLessonCard` / `HomeDailyAnchor`.** Untouched. Phase 7.8
  shipped them as the floor.

---

## 4. File-level bundle

One or two commits inside one PR. Each commit passes
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` before the next
is added.

### Files modified (3)

- **[`packages/ui-web/src/course/CourseProgress/CourseProgress.tsx`](../packages/ui-web/src/course/CourseProgress/CourseProgress.tsx)**
  — the prop contract and the JSX both shrink. Concretely:

  - Remove `nextLesson`, `nextHref` from `CourseProgressProps`.
  - Remove the `<Link>` block guarded by `hasStarted && nextLesson`.
  - Rename the `currentKicker` derivation from
    `hasStarted ? 'NASTAVI' : 'ZAPOČNI'` to journey-day framing.
    Accepts a new prop `journeyDayLabel: string | null`: when non-null
    (mid-course), the eyebrow renders `journeyDayLabel` verbatim
    (e.g. `'Tvoj 4. dan'` rendered in mono uppercase via the existing
    `tiny mono` class); when null (idle), renders `'ZAPOČNI'`. The
    `hasStarted` prop can stay (drives the `CompletionDot` state and the
    "is this a recommended start vs a continue" framing) or be replaced
    by `journeyDayLabel !== null`; pick the smaller diff at implementation
    time.
  - Remove the `<p className={`tiny mono ${styles.ringMeta}`}>{completed} /
    {total} završeno</p>` element from the ring block.
  - Keep everything else: ring, ring `xx%`, current row title +
    `DAN nnn` badge + hover state + a11y.

- **[`packages/ui-web/src/course/CourseProgress/CourseProgress.module.css`](../packages/ui-web/src/course/CourseProgress/CourseProgress.module.css)**
  — minor cleanup:

  - Delete `.ringMeta` (and `.ringValueZero` stays — still used for the
    `0%` case inside the ring).
  - Tighten `.rows` and `.ringBlock` spacing now that the second row and
    the meta line are gone — the card should feel calmer, not emptier.
    Likely changes: `.rows` keeps one child max; the `gap` becomes
    unnecessary but harmless to leave. Visual tuning happens at
    screenshot review.
  - Remove the `gap: var(--space-3)` justification on `.rows` if it
    creates dead space below the single row.

- **[`apps/web/app/course/[courseId]/_components/CourseOverviewProgress.tsx`](../apps/web/app/course/[courseId]/_components/CourseOverviewProgress.tsx)**
  — drop the next-lesson derivation, compute the journey-day label, pass
  the simplified shape:

  - Delete the `let nextLesson = null; if (currentLesson) { ... }` block.
  - Compute `journeyDayLabel = completed > 0 ? `Tvoj ${Math.min(completed + 1, 365)}. dan` : null;`.
  - Stop passing `nextLesson` / `nextHref` to `<CourseProgress />`. Pass
    `journeyDayLabel` instead.
  - The existing `currentLesson` / `currentHref` derivation, era-label
    lookup, and reading-time suppression for placeholders stay exactly
    as today. (Note: post-content-corpus there are no placeholder
    lessons, but the guard is harmless and matches the schema.)

### Files modified (2 more, smaller)

- **[`packages/ui-web/src/course/CourseCard/CourseCard.tsx`](../packages/ui-web/src/course/CourseCard/CourseCard.tsx)**
  — one line removed:

  - Delete the `{isCurrent ? <Chip variant="accent">u toku</Chip> : null}`
    expression inside `.progressMeta`.
  - Drop the now-unused `Chip` import.
  - Everything else (count, progress bar, status icon, accent title
    colour on `.current`) stays.

- **[`packages/ui-web/src/course/CourseCard/CourseCard.module.css`](../packages/ui-web/src/course/CourseCard/CourseCard.module.css)**
  — possibly nothing. `.progressMeta` is a flex row with
  `justify-content: space-between` and `gap: space-3`; with one child it
  collapses to a single-aligned label, which reads fine. Inspect at
  screenshot review — if the count drifts visually, swap
  `justify-content` to `flex-end` so the count lives where the chip used
  to. No CSS edit unless that issue appears.

### Files touched for verification (1)

- **[`apps/web/e2e/smoke.spec.ts`](../apps/web/e2e/smoke.spec.ts)**
  — add one new test asserting the consolidation. Proposed shape:

  - Navigate to `/course/istorija-srbije-365` in a fresh session.
  - Assert exactly **one** `CompletionDot`-led row exists on the
    `CourseProgress` card (no `SLEDEĆE` sibling). Pragmatic locator:
    inside the progress card, expect `getByText('SLEDEĆE')` to have
    count `0`.
  - Assert the row's eyebrow reads `ZAPOČNI` (idle).
  - Seed one completion via `addInitScript` (same pattern as the
    7.8 daily-anchor test), reload, assert the row's eyebrow now reads
    `Tvoj 2. dan` (or matches a `/Tvoj 2\. dan/i` regex).
  - Assert no `u toku` accent chip is rendered on any era card.

  The other existing tests stay as-is. Test count goes from 9 → 10;
  Playwright runs go from 45 → 50 (5 profiles).

### Files NOT touched

For paranoia. Anything outside this list should not appear in the PR
diff:

- `packages/ui-web/src/course/CourseSidebar/*`
- `packages/ui-web/src/course/SectionAccordion/*`
- `packages/ui-web/src/course/EraGroup/*`
- `packages/ui-web/src/course/LessonNavItem/*`
- `packages/ui-web/src/course/JumpToDay/*`
- `packages/ui-web/src/course/CurrentLessonCard/*`
- `packages/ui-web/src/primitives/Chip/*` (the primitive stays — it's
  still used elsewhere)
- `apps/web/app/page.tsx` / `_components/HomeDailyAnchor.tsx` /
  `_components/HomeCurrentLessonCard.tsx`
- `apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx`
  (the accordion logic, per D5)
- `apps/web/app/course/[courseId]/page.tsx` (the page header stays)
- `apps/web/app/course/[courseId]/lesson/[lessonId]/*` (lesson reader
  untouched)
- `@learn365/core` selectors — no new selector for the journey-day math
  (see §2)
- Content model / validator / generated content

---

## 5. Verification (whole phase)

Per the 7.x cadence:

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
- `pnpm validate-content` green (365 / 37 / 8).
- Existing Playwright smoke (9 tests × 5 profiles = 45 runs, 43 pass /
  2 documented WebKit skips) passes unchanged. New assertion: 10th
  test × 5 profiles. Expected 48 pass / 2 skips.
- Screenshot pack regenerated locally via `pnpm screenshots`. Shots to
  review (mobile + desktop, fresh + mid-course):
  - `mobile-course.png` (fresh) — `CourseProgress` card shows ring +
    one row with eyebrow `ZAPOČNI`. No `N / 365 završeno` text under
    the ring. No `SLEDEĆE` row. Era cards have no `u toku` chip.
  - `mobile-course-with-progress.png` (2 lessons completed) — eyebrow
    reads `Tvoj 3. dan`. The current era's `CourseCard` has its
    `--accent-ink` title and `done / total` count, but no chip.
  - `desktop-course.png` + `desktop-course-with-progress.png` — same,
    wider layout.
  - Cross-check: the screenshot capture race documented in the memory
    "Screenshot capture race" — if TopBar/Footer look unstyled in a
    capture, trust the live build, not the PNG.
- Live audit at the local dev server (`pnpm dev`, port 3000):
  - Open `/course/istorija-srbije-365` in a fresh browser. Confirm one
    canonical row; eyebrow `ZAPOČNI`; ring `0%`; eight era cards each
    showing `0 / N` and a flat progress bar; no chip on any card.
  - Complete Day 1, return to the course page. Eyebrow now reads
    `Tvoj 2. dan`; row title is whatever the registry resolves as
    `currentLesson` (last-opened fallback → Day 1 again until a new
    lesson is opened). The Era I card shows `1 / N` and a non-zero bar;
    title in `--accent-ink`; no chip.
  - Phase 6.5 lock holds: open Day 50 without completing, return to
    the course page. Eyebrow stays `Tvoj 2. dan` (driven by
    `completedCount`, not by opened state); the row's `currentLesson`
    can update to Day 50 (it's the last-opened lesson) — both behaviours
    are existing and unchanged.
- A11y spot-check at mobile width:
  - The single canonical row's accessible name still reads useful
    ("Tvoj 4. dan · {title} · DAN 016" or equivalent — exact aria-label
    finalised at screenshot review).
  - Era cards' `aria-label="Epoha N: {title}"` unchanged.

---

## 6. Risks

- **Visual emptiness on the `CourseProgress` card.** Removing the second
  row and the ring meta could leave the card looking under-filled,
  especially on desktop where the right column has space for one row.
  Mitigation: ring stays at 120px (centrepiece), single row keeps its
  generous 16px serif title + day badge, card padding stays. If the
  card still reads as bare, the smallest correct add is a one-line
  course caption (e.g. `'365 dana, jedna lekcija dnevno.'`) under the
  ring, not bringing the `SLEDEĆE` row back. Decision deferred to
  screenshot review; the plan does not lock a caption.

- **Journey eyebrow stutter when read with Home.** A user who sees `Tvoj
  4. dan` on Home and then sees `Tvoj 4. dan` again at the top of the
  course overview could read it as repetition rather than continuity.
  Mitigation: the body of the row is the literal lesson identity (title
  + day badge), so the second occurrence reads as "your fourth day → DAN
  016: {title}", not as duplication. Same eyebrow, different payload.

- **"`Tvoj 2. dan` while still on Day 1"** — the journey counter is
  `completedCount + 1`. After completing one lesson, it reads
  `Tvoj 2. dan` even before the user opens Day 2. This is the same
  behaviour Phase 7.8 already shipped on Home (the framing is "the day
  you are *on*, not the one you last finished"). Mitigation: none — it's
  intentional and consistent.

- **Out-of-order completion.** Same as the 7.8 risk: a user who completes
  Day 50 first sees `Tvoj 2. dan` while their current lesson is Day 50.
  Acceptable; out-of-order completion is a power-user pattern. The eyebrow
  is journey framing; the row's title + day badge is the literal target.

- **The `hasStarted` semantics overlap with `journeyDayLabel`.** Two
  closely-related signals on one prop surface. Mitigation: pick one
  source of truth in the adapter (`completedCount > 0`) and derive both;
  the primitive can either keep `hasStarted` as a separate prop or stop
  taking it and infer from `journeyDayLabel !== null`. Either is fine —
  pick the smaller diff at implementation time.

- **Screenshot capture race.** Documented separately. Trust the live dev
  build over any PNG that shows unstyled TopBar/Footer.

---

## 7. How to proceed

1. **Owner reviews this plan**, confirms or amends the proposed decisions
   D1–D6 above.
2. **On green-light**, open `feat/phase-7-9-progress-consolidation` off
   `main`.
3. **Land one (or two small) commits** in the order in §4. Each commit
   passes typecheck + lint + unit tests + build before the next is added.
4. **Push and open a draft PR** so the Vercel preview deploy generates a
   live URL.
5. **Owner previews on mobile + desktop**, fresh + seeded states.
   Approves or calls out copy / layout.
6. **On approval the PR merges**, `docs/PROJECT_STATE.md` gains a
   "Phase 7.9 — Progress narrative consolidation: done" section,
   `HANDOFF.md` refreshes the next-step pointer to **Phase 7.10 + 7.12**
   (Trust scaffolding + figures, in one editorial PR window), and
   `docs/PHASE_7_9_PLAN.md` moves into `docs/archive/phases/`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- The progress storage shape or any `@learn365/core` selector.
- `HomeDailyAnchor`, `HomeCurrentLessonCard`, `HomeHeroCta`,
  `HomeEraTimeline`.
- The TopBar capsule.
- The era accordion logic in `CourseOverviewEras.tsx` (D5).
- The section-row `done / total` switch (D5).
- The lesson reader, sidebar, drawer, prev/next.
- The historical timeline component.
- `apps/api`, backend, or any swap-seam adapter.
- The content model, the validator, or any `_generated.ts` regen step.
