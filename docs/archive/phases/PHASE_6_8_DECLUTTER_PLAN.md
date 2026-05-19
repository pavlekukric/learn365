# Phase 6.8 — Lesson page declutter & navigation polish (PLAN)

**Status:** Decisions resolved 2026-05-15. Ready to implement on owner green-light.
**Date:** 2026-05-15
**Parent review:** [`docs/UX_REVIEW_2026-05-15.md`](./UX_REVIEW_2026-05-15.md)

## Resolved decisions (2026-05-15)

1. **Drop the `VREMENSKA OSA` timeline panel from the mobile drawer entirely.** ✓
2. **Drop `JumpToDay` from the lesson sidebar entirely.** ✓ (stays on Course overview page)
3. **Era I fix: option (a) — rename + widen.** ✓ Era I title becomes
   *"Od praistorije do ranog srednjeg veka"* (working title — to be finalised
   in 6.8h), `yearStart` lowered to span the Stone Age, `yearsLabel`
   regenerated. No new 9th era.
4. **Cadence: 5 review rounds.** Bundle 1 = 6.8a+b; Bundle 2 = 6.8c;
   Bundle 3 = 6.8d+e; Bundle 4 = 6.8f+g; Bundle 5 = 6.8h.

---

## What this phase is

A focused decluttering pass on the lesson detail screen — desktop *and* mobile —
plus three small navigation correctness fixes that surfaced in the same review.
Everything in this plan is **removal, simplification, or making something that
*looks* clickable actually clickable.** No new visual design, no new components
beyond a small `Breadcrumbs` prop. Identity (Editorial palette, Spectral serif,
calm hairlines) stays exactly as it is.

The phase is intentionally split into **seven small, independently-shippable
steps** so each one can be reviewed, screenshot-checked on the live site, and
rolled back in isolation if it doesn't read right.

---

## Confirmed already (no work needed)

- **The mobile "Sadržaj" drawer is already on the left.** Anchored to
  `left: 0` with a `translateX(-100%) → 0` slide-in in
  `packages/ui-web/src/lesson/MobileLessonDrawer/MobileLessonDrawer.module.css`.
  We will keep this exactly as-is — it matches the desktop sidebar position and
  the user's mental model.

---

## Decisions needed from you before I start

These three need a yes/no from you. The rest of the plan is concrete; these are
the load-bearing forks.

1. **Mobile drawer: drop the inline `VREMENSKA OSA` timeline panel entirely?**
   The drawer currently stacks: timeline (8 eras vertical) + KURS header
   + IDI NA DAN + content tree. That's the noise you saw. The cleanest
   simplification is to **remove the timeline from the drawer** — desktop keeps
   its inline timeline above the reader; mobile reaches the timeline by going
   back to the Course overview (one tap on "Nazad"). The drawer's job becomes
   *just contents*. **Recommendation: YES, drop it.**

2. **`JumpToDay` in the lesson sidebar: drop entirely?**
   The form widget in a nav rail is the single biggest noise source. It already
   lives on the Course overview header. **Recommendation: drop from the lesson
   sidebar entirely.** If you want a fast-jump path from the lesson page,
   alternative is a small text link "↗ Idi na dan" in the sidebar header that
   points to the Course page (and focuses the input there). **Recommendation: drop it cleanly.**

3. **Era I content fix (from review §2.1).**
   This is the Lepenski Vir / 9500 BCE inside Era I (yearStart 600) problem.
   Three options — **(a)** rename + widen Era I to honestly span "Praistorija
   → rani srednji vek" with an earlier `yearStart`; **(b)** add a 9th era;
   **(c)** re-scope the content. Each has knock-on effects.
   **Recommendation: (a)**, because it's a copy + data tweak with no structural
   churn and keeps the "8 eras locked" decision intact.
   *I will not start Phase 6.8h (the content fix) until you pick.*

> If you say "yes, yes, (a)" we go. If you'd rather a different shape on any of
> these, the plan adjusts before code.

---

## Phases — small, ordered, each independently shippable

Each phase has a short justification, an exact file list, what stays unchanged,
and how I'll verify it. The order is chosen so each step makes the next one
trivial.

### Phase 6.8a — Lesson sidebar header simplified

**Goal:** Remove the duplicate progress and the `JumpToDay` form from the
lesson sidebar header. The header collapses to: `KURS` kicker + course title.
That's it.

**Files touched (3):**
- `packages/ui-web/src/course/CourseSidebar/CourseSidebar.tsx` — drop the
  `<ProgressBar>` block and the `<JumpToDay>` block from the header. Header
  becomes `kicker + courseTitle` only.
- `packages/ui-web/src/course/CourseSidebar/CourseSidebar.module.css` — drop
  `.progress` and `.progressMeta` rules; tighten header padding now that it's
  shorter.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` —
  no functional change; verify `sidebarProps` no longer needs to compute
  progress (it doesn't — `CourseSidebar` computed it internally and that code
  goes away with the bar).

**Unchanged:** the per-section `X / Y` counters inside `SectionAccordion`
(those carry real local information), the era → section tree, all hover/focus
states, the TopBar progress capsule.

**Why this is safe:** the canonical course-progress indicator is the sticky
TopBar capsule, which is visible on every screen and never scrolls away. The
sidebar copy was strictly redundant.

**Verification:** typecheck + unit tests + Playwright smoke + visual check that
the sidebar starts with the course title on a clean line and the era tree
begins immediately below.

### Phase 6.8b — Mobile drawer = just the contents tree

**Goal:** The "Sadržaj" drawer becomes a single calm column: the era → section
→ lesson tree. No timeline panel pinned at the top, no kicker, nothing else.

**Files touched (3):**
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` —
  delete the `.drawerTimeline` block (`<HistoricalTimeline variant="compact">`)
  and the `.drawerKicker`. Drawer children become just `<CourseSidebar … />`.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.module.css` —
  delete `.drawerContents`, `.drawerTimeline`, `.drawerKicker` rules.
- `packages/ui-web/src/lesson/MobileLessonDrawer/MobileLessonDrawer.tsx` —
  `ariaLabel` default reverts to `"Sadržaj kursa"` (was `"Sadržaj i vremenska osa"`).

**Unchanged:** the drawer's positioning (left, 360px / 86vw), the slide-in
animation, the close button, the focus trap, body scroll lock, ESC handling.
The `compact` variant of `HistoricalTimeline` stays in `ui-web` — it just
isn't called from the drawer anymore. If you decide later you want the timeline
back, the variant is still there.

**Knock-on:** combined with 6.8a, the mobile drawer goes from ~5 stacked
sections to **1**. This is the single biggest "make it premium" move in the
plan.

**Verification:** Playwright e2e (the layout-aware "lesson reader shows day,
sidebar, timeline" test needs its drawer-timeline assertion *removed* on
single-column profiles; the inline-desktop branch stays); visual check on a
real phone.

### Phase 6.8c — Article left-aligns against the sidebar

**Goal:** Stop centring the article in an over-wide column. Anchor the reading
column flush left of the desktop reader column with a fixed left gutter; let the
right side carry the breathing room.

**Files touched (1):**
- `packages/ui-web/src/lesson/LessonReader/LessonReader.module.css` —
  `.reader { margin: 0 auto }` → `.reader { margin: 0 }`. Keep
  `max-width: var(--reading-col)` (660px reading measure stays).
- *Possibly* tweak `apps/web/…/LessonPageClient.module.css` `.readerColumn`
  padding from `0 var(--space-9)` to a left-weighted variant
  (e.g. `0 var(--space-10) 0 var(--space-9)`). I'll decide this after seeing the
  result of the simpler change first.

**Unchanged:** the 660px reading measure (this is calibrated for serif body
type and shouldn't move), mobile (single-column) layout, the breadcrumb /
header / footer stacking.

**Verification:** screenshots at 1024 / 1280 / 1440 / 1920 desktop widths. If
left-flush feels too tight against the sidebar at 1440+, I'll re-introduce a
modest left gutter — the goal is *anchored to the rail*, not *crammed against it*.

### Phase 6.8d — Breadcrumbs become real links

**Goal:** Make breadcrumbs navigate. Today every crumb except the last renders
as a `<span>` because `LessonPageClient` passes `onClick: undefined`. We
finally pay off the Phase-3 "`onClick → href` revision" tech debt called out in
`PROJECT_STATE.md`.

**Files touched (4):**
- `packages/ui-web/src/primitives/Breadcrumbs/Breadcrumbs.tsx` — extend
  `BreadcrumbItem` with an optional `href?: string`. Render order: `href` →
  `<Link>`; `onClick` → `<button>` (kept for callers that genuinely need it);
  neither → `<span>` (current page). Last item always `<span>`.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` —
  build breadcrumbs with hrefs: Početna → `/`, course title →
  `/course/[id]`, era title → era's first lesson (we already compute that via
  `eraHref`). Last crumb (`Dan nnn`) stays a span.
- `docs/COMPONENT_LIBRARY.md` — note the `href` addition (clears the open
  Phase-3 doc-debt item).
- Any other `<Breadcrumbs>` callers — quick grep; none currently pass `onClick`
  in production code, but I'll confirm.

**Unchanged:** the breadcrumb visual style, the `≤560px` "hide all but last
two" rule, the separator slash.

**Verification:** typecheck (breadcrumb type change is the only API surface);
manual click-through each crumb on the live site.

### Phase 6.8e — Tree shows where you are, not everything that exists

**Goal:** In the lesson sidebar, only the **current era** is expanded by
default. Other 7 eras are collapsed. Inside the current era, the current
section stays expanded (today's behaviour, kept).

**Files touched (3):**
- `packages/ui-web/src/course/CourseSidebar/CourseSidebar.tsx` — add
  `openEraIds` state (default = `new Set([currentEraId])`), pass `isOpen` +
  `onToggle` to `EraGroup`.
- `packages/ui-web/src/course/EraGroup/EraGroup.tsx` — accept `isOpen` +
  `onToggle`, render the era header as a `<button>` with chevron + `aria-expanded`.
  Body becomes conditional. Same visual treatment as `SectionAccordion`'s header
  pattern.
- `packages/ui-web/src/course/EraGroup/EraGroup.module.css` — chevron + open
  state + focus ring (mirror `SectionAccordion`'s patterns to stay consistent).

**Unchanged:** the section accordion inside an era; the active-section
highlighting; the per-era completion math.

**Risk:** This is the highest-judgement step in the plan. A two-level accordion
can feel "click-everything to find anything". Mitigation: the current era is
**already open** when you land on the page, so the user lands on "here you are"
and the other 7 are one calm tap away. If after shipping this it doesn't read
right, the rollback is one CSS rule (`isOpen` defaults to `true`).

**Verification:** visual + interaction test on desktop + mobile drawer.

### Phase 6.8f — Hero copy tightened, day labels normalised

**Goal:** Stop the hero from introducing the course twice; normalise three day
formats to two (`DAN 001` everywhere except the tight `D001` tabular column).

**Files touched (3):**
- `apps/web/app/page.tsx` — drop the `<p className="lede">{course.subtitle}</p>`
  line; keep the `HERO_DESCRIPTION` paragraph below it.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` —
  breadcrumb construction: `Dan ${nnn}` → `DAN ${nnn}`.
- Quick grep for any other `Dan ` (capital-D-lowercase-an) usages and unify.

**Unchanged:** `D001` style in `LessonNavItem` and `SectionAccordion` ranges
(tabular column, intentionally compact).

**Verification:** screenshot of Home; click-through breadcrumb.

### Phase 6.8g — Placeholder lessons visually signalled

**Goal:** When the user opens the sidebar (mobile drawer or desktop), the 6
authored lessons stand out as *available* and the 359 placeholders read as
*upcoming*. No content is added; this is purely a visual signal so exploration
stops walking into dead rooms blindly.

**Files touched (3):**
- `packages/ui-web/src/course/LessonNavItem/LessonNavItem.tsx` — accept the
  existing `lesson.isPlaceholder` flag; when true, render the row with
  `--faint` colour ramp, no completion dot (or a hollow `--rule` dot).
- `packages/ui-web/src/course/LessonNavItem/LessonNavItem.module.css` —
  `.state_placeholder` rules.
- `packages/ui-web/src/course/SectionAccordion/SectionAccordion.tsx` and
  `apps/web/…/_components/CourseOverviewEras.tsx` — pass the flag through.

**Unchanged:** the placeholder lesson page itself (already shows the calm
"upcoming" card, which is good). The accordion `X / Y` counters keep counting
*all* lessons in the section — completion ratios remain honest.

**Verification:** visual check that the 6 authored days are visibly
foregrounded in the tree.

### Phase 6.8h — Era I content fix (BLOCKED on decision)

**Goal:** Resolve the Era I `yearStart: 600` vs. Lepenski Vir at 9500 BCE
contradiction.

**Pending decision (a / b / c above).** If you pick **(a)** as recommended:
- `packages/content/src/courses/istorija-srbije-365/eras.ts` — Era I `id` may
  stay (renaming would cascade into section data); `title` widened to e.g.
  *"Od praistorije do ranog srednjeg veka"*; `yearStart` lowered to e.g.
  `-9500`; `yearsLabel` updated; `eraShort` updated.
- Validator (`packages/content/src/courses/istorija-srbije-365/validate.ts`) —
  verify no rule breaks.
- `apps/web/e2e/smoke.spec.ts` — quick scan for any hard-coded "Doseljavanje"
  copy in assertions.

**Verification:** `pnpm validate-content` passes; the Lepenski Vir lesson now
shows the era label that actually matches its year.

---

## Engineering gates per phase

Every phase, before merging:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (Vitest — currently 79 tests across the workspace)
- `pnpm build`
- `pnpm validate-content`
- `pnpm test:e2e` (Playwright — currently 8 tests × 5 profiles = 40 runs;
  expect some assertions to need updating in 6.8b and 6.8d)

---

## What I will **not** touch in this phase

- Color tokens, type tokens, motion tokens — already calibrated
- `TopBar` — already polished in Phase 6.4 / 6.5
- `HomeEraTimeline` — Phase 6.6 work, intentional
- The mobile `LessonContextHeader` — Phase 6.7 work, still load-bearing on
  ≤1024px
- Authored lesson *content* (editorial review is a separate workstream
  outstanding from Phase 5)
- Screen-reader smoke (separate outstanding item)
- Anything in `apps/api` / backend / mobile (out of v1 scope)

---

## How I want to proceed

1. **You read this and answer the three decisions** at the top.
2. **I update the plan** if any answers change scope.
3. **I implement Phase 6.8a first** as a single PR/commit, you eyeball the live
   preview, we agree it reads right, and we move to 6.8b.
4. Each subsequent phase the same way — one at a time, screenshot-reviewed.
5. After 6.8g (or 6.8h if (a) is approved), `PROJECT_STATE.md` is updated and
   the phase is closed.

If you want a faster shape — "do 6.8a + 6.8b + 6.8d together, then I'll review
the bundle" — I'm happy with that too. Tell me the cadence you want.
