# Phase 7.5 — Mobile lesson sticky chrome scroll-collapse (PLAN)

**Status:** Draft, awaiting owner green-light to implement.
**Date:** 2026-05-19
**Predecessors:** Phase 7.12b — era-opener figures shipped
(merged 2026-05-19, PR #22, commit `542edad`). The lesson-reader surface and
the `LessonContextHeader` are at the declared baseline in
`docs/PROJECT_STATE.md` § Current Baseline — 2026-05-19.
**Parent references:**

- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: Phase 7.5 — Mobile lesson sticky
  chrome scroll-collapse." Pre-existing pre-7.0 polish backlog item.
- [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md) — 7.5/7.6 polish
  items preserved through the 7.7–7.12 reframe.
- [`docs/archive/phases/PHASE_6_7_MOBILE_LESSON_CONTEXT.md`](./archive/phases/PHASE_6_7_MOBILE_LESSON_CONTEXT.md)
  — the phase that introduced `LessonContextHeader` as the single-column
  sticky chrome. This phase modifies that component's scroll behaviour only.
- [`docs/UX_REQUIREMENTS.md`](./UX_REQUIREMENTS.md) — premium / calm / editorial
  bar; motion must read as restrained, never twitchy.

## Why this is the next phase

On the single-column lesson reader (≤1024px) the
[`LessonContextHeader`](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx)
is `position: sticky` directly under the sticky TopBar
([`LessonContextHeader.module.css:8`](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.module.css#L8)).
Stacked, the two pieces of chrome consume ~64px (TopBar) + the two-row context
header before any lesson prose is visible. On a phone that is a meaningful
slice of the viewport held permanently while reading.

This phase lets the **secondary meta row** (era label + total-progress bar)
collapse away as the reader scrolls down into the body, and restore when they
scroll back up — reclaiming vertical reading space mid-lesson while keeping the
navigation affordance permanently reachable.

Low blast radius: one component file + its CSS, one tiny scroll-direction hook,
no content/schema/dependency changes. Effort ~half a day.

---

## 1. Locked decisions

Confirmed with the owner on 2026-05-19.

### D1 — Collapse the meta row only; keep the contents row always sticky

`LessonContextHeader` renders two rows
([`LessonContextHeader.tsx:46`](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx#L46)):

- **`.topRow`** — the `Sadržaj` contents trigger (opens the
  `MobileLessonDrawer`) + the centered `DAN nnn / 365` indicator.
- **`.metaRow`** — the era label + the total-progress bar/count.

On scroll-**down**, only `.metaRow` collapses (height + opacity → 0). The
`.topRow` stays fully sticky at all times, so the `Sadržaj` drawer trigger and
the day position are always one tap away — the reader is never stranded without
navigation. On scroll-**up**, `.metaRow` restores.

Rejected: hiding the whole header (slides the `Sadržaj` trigger off-screen).
Reclaims slightly more space but removes the in-page navigation affordance
mid-read and forces a scroll-up just to reach contents. The calm-navigation bar
favours always-reachable wayfinding over a few extra pixels.

### D2 — Active at all single-column widths (≤1024px)

The collapse runs at exactly the breakpoint where `LessonContextHeader` is
shown — `@media (max-width: 1024px)`. On the desktop two-column layout the
header is `display: none` and the behaviour is irrelevant. Consistent rule:
wherever the sticky context header appears, it collapses.

### D3 — Direction-based, with a small dead-zone and a top-of-page guard

- Collapse triggers on a sustained **scroll-down** past a small threshold from
  the top; restore on any **scroll-up**.
- A dead-zone (≈8px of delta) prevents flicker from sub-pixel / momentum
  jitter.
- Within the first ~`topbar-height + header-height` of scroll (near the very
  top), the meta row is always shown — no collapse while the page header region
  is still in view.

### D4 — Respect `prefers-reduced-motion`

The collapse uses a CSS transition on `max-height` / `opacity`. Under
`prefers-reduced-motion: reduce` the transition is removed (instant
show/hide), matching the existing reduced-motion handling across the UI
(`MobileLessonDrawer`, `HistoricalTimeline`, `ProgressBar`, etc.). The
collapse logic itself still runs — only the animation is dropped.

### D5 — One PR, single commit

Small enough for a single commit with a clean one-line revert. No sub-bundle
chain.

---

## 2. Scope — what 7.5 is

**Phase 7.5 = on ≤1024px, the `LessonContextHeader` meta row collapses on
scroll-down and restores on scroll-up; the contents row stays sticky.**

Held as durable truth for this phase:

- Renderer/CSS scope only. No content, no schema, no new npm dependency.
- The `LessonContextHeader` props/markup are unchanged except for the wrapper
  state class and the `.metaRow` becoming a collapsible region.
- The desktop two-column layout is untouched (header is `display: none` there).
- `ReadingProgress` (the thin top scroll-progress line) is unchanged — it
  already owns its own rAF scroll listener and is independent of this work.
- The TopBar is unchanged.

---

## 3. What this phase is NOT addressing

- **TopBar scroll behaviour.** The global TopBar stays fully sticky; only the
  lesson context header's meta row collapses.
- **Desktop layout.** No two-column changes.
- **Hiding the contents trigger.** Rejected in D1.
- **Course-page scroll restore.** That is Phase 7.6, a separate item.
- **`ReadingProgress` line.** Independent; not touched.
- **Any `keyPeople` / `keyPlaces` rendering.** Out of scope.
- **Backend / `apps/api`.** N/A.

---

## 4. File-level bundle

One commit inside one PR.
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` green before push.

**Files added (1):**

### New scroll-direction hook

- `apps/web/app/course/[courseId]/lesson/[lessonId]/useScrollDirection.ts` —
  a small client hook returning `'up' | 'down'` (or a `collapsed` boolean).
  Mirrors the proven pattern in
  [`ReadingProgress.tsx`](../apps/web/app/course/[courseId]/lesson/[lessonId]/ReadingProgress.tsx):
  a `requestAnimationFrame`-coalesced `scroll` listener (`{ passive: true }`),
  comparing `window.scrollY` against the last sampled value with the D3
  dead-zone and top-of-page guard. Cleans up the listener + cancels the frame
  on unmount. No state writes on every scroll event — only when the direction
  actually flips, so React re-renders are rare.

  Rationale for a separate file: keeps `LessonContextHeader` presentational and
  the scroll math unit-reasoned in isolation; co-located with the only consumer
  rather than promoted to `@learn365/ui-web` until a second caller exists.

**Files modified (2):**

### Component

- [`LessonContextHeader.tsx`](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx)
  — call `useScrollDirection`, derive a `collapsed` boolean, and toggle a
  `styles.collapsed` class on the root `.header` element. The `.metaRow` gains
  `aria-hidden` synced to `collapsed` so its content (era + progress) is not
  announced/focusable while visually collapsed. Markup otherwise unchanged;
  props unchanged.

### CSS

- [`LessonContextHeader.module.css`](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.module.css)
  — inside the existing `@media (max-width: 1024px)` block:
  - `.metaRow` becomes a collapsible region: `overflow: hidden`, an explicit
    `max-height` for the expanded state, `opacity: 1`, and a `transition` on
    `max-height` + `opacity` + `margin` using the existing
    `var(--dur-base) var(--ease)` tokens.
  - `.header.collapsed .metaRow` sets `max-height: 0`, `opacity: 0`, and zeroes
    the row gap contribution so the header shrinks to just the contents row.
  - A `@media (prefers-reduced-motion: reduce)` rule removes the transition
    (D4).

  No change to the `.header` sticky positioning, background blur, z-index, or
  the ≤380px icon-only `Sadržaj` rule.

**No test-target change beyond the assertion below.**

---

## 5. Verification (whole phase)

Per the 7.x cadence:

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
- Existing Playwright smoke suite passes unchanged.
- **One new Playwright assertion** added to
  [`apps/web/e2e/smoke.spec.ts`](../apps/web/e2e/smoke.spec.ts), gated to the
  mobile profiles: on a lesson route, scrolling the page down hides the meta
  row (era/progress not visible) while the `Sadržaj` trigger stays visible;
  scrolling back to top restores the meta row. Asserted via visibility of the
  era label / progress vs. the contents button.
- Screenshot pack regenerated via `pnpm screenshots`; mobile lesson shots
  reviewed:
  - `mobile-lesson-001.png` — top-of-page state shows both rows (unchanged from
    baseline).
  - A scrolled-state shot (added to the capture script if not already present)
    showing the collapsed meta row with the contents row still sticky.
  - `mobile-lesson-001-sadrzaj-drawer.png` — the `Sadržaj` trigger still opens
    the drawer from the collapsed state.
  - Cross-check the `mobile-screenshot-capture-race` known issue
    (`memory/project_screenshot_capture_race.md`) — a momentarily unstyled
    TopBar/Footer capture is the streaming-CSS race, not a regression from this
    phase.
- Live audit on `pnpm dev` (port 3000) in a 390px DevTools viewport: scroll
  down into a long lesson, confirm the meta row collapses smoothly and the
  contents row stays put; scroll up, confirm restore; flick-scroll to confirm
  no flicker (D3 dead-zone); toggle OS reduced-motion and confirm instant
  show/hide (D4). Repeat at ~760px (tablet) and confirm desktop ≥1025px is
  untouched.

---

## 6. Risks

- **Flicker / twitchiness.** Naive direction detection toggles on every
  sub-pixel delta. Mitigation: the D3 dead-zone (~8px) + only setting state on
  a genuine direction flip. Verified at flick-scroll during the live audit.
- **Sticky + transform / z-index interaction.** The header is sticky with a
  backdrop blur and `z-index: 10`. Collapsing via `max-height` on the inner
  `.metaRow` (not a transform on the sticky root) avoids creating a new
  stacking/containing context on the sticky element, so the sticky behaviour
  and the blur are preserved. Confirm the blur still reads over scrolling text
  at screenshot review.
- **Layout shift in the prose below.** Because the header is sticky (out of
  normal flow for the body), collapsing the meta row must not jump the article
  text. Confirm the lesson body's top offset is driven by the static header
  height at the top of the page and that the sticky collapse does not reflow
  the article. Checked in the live audit by watching the first prose line while
  collapsing.
- **`aria-hidden` on a region containing the progress bar.** Ensure nothing
  inside `.metaRow` is focusable (it is text + a decorative `ProgressBar`), so
  `aria-hidden` while collapsed introduces no focus trap. Verified by tabbing
  through the collapsed header.
- **Reduced-motion correctness.** Confirm the logic still collapses (just
  instantly) under `prefers-reduced-motion: reduce` — the motion is dropped,
  not the behaviour.

---

## 7. How to proceed

1. **Owner gives green-light to implement.** Decisions D1–D5 locked above.
2. **Open `feat/phase-7-5-mobile-scroll-collapse` off `main`** and land one
   commit: `feat(web): Phase 7.5 — collapse lesson meta row on scroll (mobile)`.
3. **Push and open a draft PR** so the Vercel preview deploy generates a live
   URL.
4. **Owner previews on mobile** (or DevTools at 390px) — scroll down/up through
   a long lesson, confirm the contents row stays and the motion reads calm.
5. **On approval the PR merges**, `docs/PROJECT_STATE.md` gains a
   "Phase 7.5 — done" section, `HANDOFF.md` refreshes the next-step pointer to
   Phase 7.6 (Course page scroll restore), and this plan moves into
   `docs/archive/phases/`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- The global `TopBar` (stays fully sticky).
- The desktop two-column lesson layout.
- The `ReadingProgress` scroll line.
- `LessonContextHeader` props or its emitted markup beyond the collapse class +
  `aria-hidden`.
- The `MobileLessonDrawer` and its trigger semantics.
- Any content JSON, schema, or `_generated.ts`.
- Anything in `apps/api` or backend.
