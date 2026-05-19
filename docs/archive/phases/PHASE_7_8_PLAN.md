# Phase 7.8 — Daily ritual anchor on Home (PLAN)

**Status:** Draft, awaiting owner green-light to implement.
**Date:** 2026-05-19
**Predecessors:** Phase 7.7 — Mobile global nav restoration (in flight,
PR #17 — assumed merged before 7.8 ships).
**Parent references:**

- [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md) — Phase 7.8 entry
  (Bundle B). Locked R2: since-you-started counter, no real-calendar
  dependency.
- Independent mobile UI/UX assessment, 2026-05-19, §4 issue #2 and §5
  opportunity #1.
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — Phase 6.5 locked
  "continue-state is completion-driven, not opened-driven." This phase
  inherits the same lock.

## Why this is the next phase

The assessment's single biggest paid-product risk is *retention*: nothing
on the current Home screen pulls a user back tomorrow. The product is
named *365* and yet there is no relationship between the user's real day
and the lesson day, no daily anchor, no "today is a day in your journey"
framing. A first-time user reads the hero and infers "365 lessons in a
catalog," not "one lesson a day for a year."

[`apps/web/app/page.tsx`](../apps/web/app/page.tsx) renders, in order:

1. `<h1>Istorija Srbije 365</h1>`
2. `<p>~9500 p.n.e. → danas · 365 dana</p>` (chronological scope)
3. `<p>Kroz osam epoha i 365 kratkih lekcija…</p>` (description)
4. `<Flourish />`
5. `<HomeHeroCta>` — "Započni kurs" / "Nastavi lekciju"
6. `<HomeCurrentLessonCard>` with an `Eyebrow` above
   ("Prva lekcija" / "Nastavi gde si stao" / "Nedavno završeno")
7. `<HomeEraTimeline>` — 8-era journey rail

Nowhere does the screen say *"one lesson a day, ~8 minutes."* The daily
ritual is the entire product premise and it is the only thing the screen
doesn't carry.

Low blast radius: one new component, three small edits to existing files,
one Playwright assertion. No data-model change, no storage change, no
new routes. One PR, one commit (or two if `page.module.css` gets large
enough to warrant a separate styling commit).

---

## 1. Locked decisions

Confirmed with the owner on 2026-05-19 during the Phase 7.7 implementation
window.

### D1 — Two-state model: idle + in-progress only

No "done-today" state. R2 locked "since-you-started counter, no
real-calendar dependency" — and "Vidimo se sutra" framing requires a
calendar concept of "tomorrow" that v1 doesn't have. A timestamp on
`lastCompletedAt` would enable honest done-today detection but is
out-of-scope here (revisit post-Phase 8 when timezone-aware backend
sync exists).

State source is the existing `completedCount` selector:

- `completedCount === 0` → **idle**
- `completedCount > 0` → **in-progress**

This mirrors Phase 6.5's locked "completion-driven, not opened-driven"
rule. Merely opening a lesson never flips the anchor into in-progress —
consistent with the existing `HomeHeroCta` / `HomeCurrentLessonCard` /
`CourseOverviewProgress` semantics.

The "since-you-started" counter N for the in-progress state is
**`Math.min(completedCount + 1, 365)`**: the number of the day the user
is currently working on, capped at 365 defensively. Worked examples:

| completedCount | Counter shown | State |
| --- | --- | --- |
| 0 | (no counter) | idle |
| 1 | "Tvoj 2. dan" | in-progress |
| 3 | "Tvoj 4. dan" | in-progress |
| 365 | "Tvoj 365. dan" | in-progress (capped) |

The counter intentionally exceeds `completedCount` by 1 — it names the
day the user is *on*, not the day they last finished. This matches the
literal Serbian register: "Tvoj 4. dan" reads as "your fourth day of
walking the path," not "you have completed four days."

### D2 — Replace `HERO_DATE_LINE` with the daily-contract caption

The current chronological scope line
(`~9500 p.n.e. → danas · 365 dana`) gets replaced with
`365 lekcija · 1 dnevno · ~8 minuta`. One line, one job, daily premise
above the fold.

Chronological scope is anyway encoded in:

- The 8-era timeline below (era years 9500 p.n.e. → 2026).
- The course-overview era cards.
- The lesson reader's eyebrow.

So dropping it from the hero is not a content loss — it's deduplication.

### D3 — Drop the eyebrow on `HomeCurrentLessonCard`

Today `apps/web/app/_components/HomeCurrentLessonCard.tsx` renders an
`Eyebrow` above the card with state-aware copy ("Prva lekcija" /
"Nastavi gde si stao" / "Nedavno završeno"). With the new
`HomeDailyAnchor` block above the card carrying the state explicitly, the
eyebrow becomes a duplicate label.

Drop the `<Eyebrow>` element. The card itself (with its DAN nnn label,
title, era, and reading time) carries the lesson identity; the anchor
above carries the state. One label per state, not two.

The `LABEL_BY_STATE` map in `HomeCurrentLessonCard.tsx` becomes unused
and is deleted. The component itself becomes a pure passthrough to the
`CurrentLessonCard` primitive plus state derivation.

### D4 — One PR, one or two commits

Mirrors 7.7's "land one commit" cadence. If the page CSS edits stay
small the whole thing ships as one commit. If positioning the new block
requires non-trivial responsive tuning, split as:

- 7.8a: `HomeDailyAnchor` component (new) + mount in `page.tsx` (existing
  CSS layout unchanged).
- 7.8b: page CSS adjustments + drop the eyebrow on `HomeCurrentLessonCard`.

Decision deferred to the implementation moment — neither shape changes
the file list or the verification plan.

---

## 2. Scope reframe — what 7.8 is, and what it is not

**Phase 7.8 = a new state-aware "Danas" block on Home that makes the
daily-lesson premise explicit, plus deduplication of the now-redundant
date-line and card eyebrow.**

Held as durable truth for this phase:

- One new component, in `apps/web/app/_components/HomeDailyAnchor.tsx`.
- Computation lives inline in the component (one selector read, one
  cap, one branch). No new selector in `@learn365/core` — the logic is
  too small to abstract per the "three similar lines is better than a
  premature abstraction" rule.
- Storage shape (`learn365:progress:v1`) is **not** changed.
- Content model is **not** changed.
- The `HomeHeroCta` (state-aware "Započni kurs" / "Nastavi lekciju")
  stays as-is. It is action-oriented; the Danas block is framing. They
  do different jobs and do not duplicate.
- The era timeline below is **not** touched.
- The TopBar progress capsule is **not** touched.

---

## 3. What this phase is NOT addressing

- **Streaks.** Explicit V1 exclusion in `CLAUDE.md`. No "3 dana zaredom"
  visualization, no streak counter, no calendar grid.
- **Real-calendar dates.** No "Danas, 19. maj" rendering. R2 locked.
- **Push notifications / email reminders.** V1 exclusion.
- **A `startDate` field in progress.** None added. The counter is pure
  `completedCount`-derived, calendar-agnostic.
- **Onboarding wizard.** A first-run intro flow is out of scope. The
  Danas block carries the daily-contract framing inline on Home.
- **`HomeCurrentLessonCard`'s state derivation logic.** Idle/active/done
  computation stays exactly as today — only the eyebrow label rendering
  is removed.
- **Course overview, lesson reader, drawer.** Untouched.
- **A "kurs završen" celebration state.** Reaching `completedCount ===
  365` in v1 is essentially impossible (only 6 authored lessons; the rest
  are placeholders that can't be completed). Defer until either the
  content volume grows or post-Phase 8 backend lets us think about real
  completion ceremonies.

---

## 4. File-level bundle

One commit inside one PR. Each commit passes
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` before push.

### Files created (1)

- **[`apps/web/app/_components/HomeDailyAnchor.tsx`](../apps/web/app/_components/HomeDailyAnchor.tsx)** (new)
  — `'use client'` component. Reads `completedCount(state, courseId)`
  from the progress store via the existing `useProgressStore` hook
  (matches the pattern in `HomeHeroCta.tsx` and `HomeCurrentLessonCard.tsx`).

  Renders one of two shapes:

  - **Idle (`completedCount === 0`):** a single calm line. Proposed
    copy: *"Pred tobom je 365 dana kroz srpsku istoriju."* Final wording
    finalized during the screenshot review — the plan locks the *shape*
    and *state-derivation*, not the exact prose.
  - **In-progress (`completedCount > 0`):** a small mono eyebrow with
    *"TVOJ {N}. DAN"* where `N = Math.min(completedCount + 1, 365)`,
    plus a calm body line. Proposed copy: *"Nastavi tamo gde si stao."*

  Output element is `<section className={styles.dailyAnchor} aria-label="Danas">`
  with a small `<span className="eyebrow">…</span>` plus a `<p className="body">…</p>`.
  No interactivity — the existing `HomeHeroCta` button is the action.

### Files modified (3)

- **[`apps/web/app/page.tsx`](../apps/web/app/page.tsx)**
  — three edits:
  1. Remove the `HERO_DATE_LINE` constant (lines 21–26 + JSX usage).
  2. Replace it with the new caption: `'365 lekcija · 1 dnevno · ~8 minuta'`
     rendered as a `<p className="mono ...">`. Or, equivalently, rename
     the constant to `HERO_CONTRACT_LINE` and change its value — the
     JSX position stays the same.
  3. Import and mount `<HomeDailyAnchor courseId={course.id} />` between
     the `<section className={styles.current}>` and its inner
     `<HomeCurrentLessonCard ... />`. The Danas block sits *inside* the
     existing `.current` section so layout/spacing inherits naturally.

- **[`apps/web/app/page.module.css`](../apps/web/app/page.module.css)**
  — likely additions:
  - `.dailyAnchor` rule: small top-margin to separate from CTA,
    bottom-margin tighter than other section gaps so it reads tied to
    the card below. Center-aligned at the `.heroInner` max-width, or
    left-aligned to match the card eyebrow today — pick during
    screenshot review.
  - `@media (max-width: 720px)` override if mobile margins need tightening.
  - No new tokens; uses existing `--ink` / `--ink-2` / `--muted` / mono +
    body classes.

- **[`apps/web/app/_components/HomeCurrentLessonCard.tsx`](../apps/web/app/_components/HomeCurrentLessonCard.tsx)**
  — remove the `<Eyebrow>{LABEL_BY_STATE[state]}</Eyebrow>` line and the
  surrounding fragment. Delete the now-unused `LABEL_BY_STATE` map and
  the `Eyebrow` import. The component returns just `<CurrentLessonCard … />`
  with its existing props. State derivation (`state ∈ {idle, active, done}`)
  is preserved — it still drives the card's internal visual state.

### Files touched for verification (1)

- **[`apps/web/e2e/smoke.spec.ts`](../apps/web/e2e/smoke.spec.ts)**
  — add one new test, replacing or extending the existing
  "home renders hero + CTA" test:

  - On `/` (fresh session), assert the Danas block is visible
    (`getByLabel('Danas')` or `getByRole('region', { name: 'Danas' })`).
  - Assert it does NOT show a "Tvoj N. dan" counter (idle state).
  - After completing one lesson and returning to `/`, assert the counter
    reads "TVOJ 2. DAN" (in-progress state). Uses the existing seed
    pattern from the screenshot capture script if convenient, or a
    direct `addInitScript` seed.

  The existing "home renders hero + CTA" assertion stays. The new
  assertions can live in the same test or in a sibling test — pick at
  implementation time.

---

## 5. Verification (whole phase)

Per the 7.x cadence:

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
- `pnpm validate-content` green (365/37/8).
- Existing Playwright smoke (9 tests × 5 profiles = 45 runs, 43 pass /
  2 documented WebKit skips) passes unchanged. New assertion: 10th
  test × 5 profiles. Expected 48 pass / 2 skips.
- Screenshot pack regenerated locally via `pnpm screenshots`. Mobile
  shots to review:
  - `mobile-home.png` (fresh) — caption reads `365 lekcija · 1 dnevno ·
    ~8 minuta`; Danas block visible above the card; card has no eyebrow.
  - `mobile-home-with-progress.png` (2 lessons completed) — Danas block
    shows "TVOJ 3. DAN" eyebrow + body line; card has no eyebrow.
  - `desktop-home.png` + `desktop-home-with-progress.png` — same, wider
    layout.
- Live audit at the local dev server (`pnpm dev`, port 3000):
  - Open `/` in a fresh browser. Confirm the daily-contract caption,
    the Danas block in idle state, the card with no eyebrow.
  - Complete Day 1, return to `/`. Confirm "TVOJ 2. DAN" reads cleanly,
    the CTA flipped to "Nastavi lekciju", and the card carries no
    duplicate label.
  - Re-confirm Phase 6.5's lock holds: open Day 20 without completing,
    return to `/`. State must still read **idle** — anchor does not show
    "TVOJ N. DAN".

---

## 6. Risks

- **"Tvoj 4. dan" reads ambiguously.** "Day of using the app" vs "day of
  the lesson number" could confuse. Mitigation: the in-progress copy
  explicitly says *"Nastavi tamo gde si stao"* (or similar) below the
  counter, anchoring it to the journey, not to a date. Final copy chosen
  at screenshot review.
- **Vertical stacking on mobile gets tall.** Hero (title + caption +
  description + Flourish + CTA) is already ~480px on a 390px-wide
  iPhone. Adding the Danas block + recommended-card extends the
  above-the-fold-to-era-list distance. Mitigation: the Danas block is
  intentionally small (one eyebrow + one body line); pair its
  `margin-bottom` tightly with the card so they read as a pair, not as
  two independent stacks.
- **First-time user might still not read the daily contract.** Captions
  are easy to skip. Mitigation: the caption is mono and small, the
  Danas block is the load-bearing element. If after launch real users
  still don't understand the daily premise, the next move is making the
  Danas block more prominent — not adding a wizard.
- **Counter feels off when the user completes lessons out of order.** A
  user who completes Day 50 first (somehow) sees "Tvoj 2. dan" while
  they're actually on Day 50. Acceptable: out-of-order completion is a
  power-user pattern, and the counter's job is journey framing, not
  navigation. The card below carries the literal target.
- **Empty content cache.** The `getLessons` registry call in
  `HomeDailyAnchor` should be a no-op (it's used elsewhere on the same
  page already) but worth a mental sanity check during implementation.

---

## 7. How to proceed

1. **Phase 7.7 merges first.** This plan assumes 7.7 has landed on `main`.
2. **Owner gives green-light to implement 7.8.** Decisions D1 + D2 + D3 +
   D4 already locked above.
3. **Open `feat/phase-7-8-daily-anchor` off `main`** and land one (or two
   small) commit(s). Each commit passes typecheck + lint + unit tests +
   build before the next is added.
4. **Push and open a draft PR** so the Vercel preview deploy generates a
   live URL.
5. **Owner previews on mobile** — fresh state and seeded state. Either
   approves or calls out copy / layout.
6. **On approval the PR merges**, `docs/PROJECT_STATE.md` gains a
   "Phase 7.8 — Daily ritual anchor on Home: done" section, `HANDOFF.md`
   refreshes the next-step pointer to Phase 7.9 (Progress narrative
   consolidation), and `docs/PHASE_7_8_PLAN.md` moves into
   `docs/archive/phases/`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- The progress storage shape or any `@learn365/core` selector.
- `HomeHeroCta` or `HomeEraTimeline`.
- The hero description paragraph (`HERO_DESCRIPTION`).
- The Flourish divider.
- The recommended-card primitive (`CurrentLessonCard` in `ui-web`) —
  only the local `HomeCurrentLessonCard.tsx` adapter drops its eyebrow.
- The era timeline component or its data.
- The TopBar progress capsule (Phase 7.9 territory).
- The course overview or lesson reader.
- Anything in `apps/api` or backend.
