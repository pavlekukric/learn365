# Phase 6.7 — Mobile lesson reading: compact context header

## Goal

On single-column layouts (≤1024px) the lesson page should feel like a premium
**reading view**, not a navigation screen. Today the full `HistoricalTimeline`
renders inline between the breadcrumbs and the lesson header — on mobile it is a
vertical 8-row block that pushes the lesson title far down the page.

This phase replaces that inline timeline (≤1024px only) with a compact, sticky
**lesson context header**, and moves the timeline into the existing "Sadržaj"
drawer alongside the course outline.

## Decisions (confirmed with product owner, 2026-05-15)

1. **Drawer contents** — the mobile "Sadržaj" drawer holds **both**: a compact
   historical timeline at the top + the course outline tree below. One unified
   navigation surface. The timeline must stay compact and must not dominate the
   drawer.
2. **Breakpoint** — tied to the layout, not the device. **≤1024px** (single
   column) → compact header + drawer. **>1024px** (two-column) → unchanged:
   left `CourseSidebar` + inline `HistoricalTimeline` in the reader.

## Target behaviour

### ≤1024px (single column)

```
┌─────────────────────────────────────────┐
│ TopBar (existing)                       │
├─────────────────────────────────────────┤
│ ‹ Nazad            DAN 001 / 365   ☰ Sadržaj │  ← LessonContextHeader (sticky)
│ Praistorija i antika      ▓▓░░░░  1 / 365    │
├─────────────────────────────────────────┤
│ Breadcrumbs                             │
│ Lepenski Vir            ← title HIGH    │  ← LessonHeader, timeline removed
│ subtitle / lede                         │
│ … lesson body …                         │
│ ─────────────────────────────────────── │
│ [ Označi kao završeno ]                 │  ← footer unchanged
│ ‹ prev            next ›                │
└─────────────────────────────────────────┘
```

- The inline `HistoricalTimeline` inside `LessonReader` is **hidden via CSS**
  (`display:none`) at ≤1024px. (`display:none` removes it from the a11y tree, so
  there is no duplicate `nav` landmark.)
- The current thin `.mobileBar` ("Sadržaj" pill + "DAN 001 · era" text) is
  replaced by a richer **`LessonContextHeader`**:
  - **Back button** → course overview (`/course/{courseId}`).
  - **"Sadržaj" button** → opens the drawer.
  - **Day indicator** — `DAN 001 / 365`.
  - **Era label** — the current lesson's era title (e.g. "Praistorija i antika").
  - **Progress** — a thin `ProgressBar` + `1 / 365` (completed / total).
- Tapping "Sadržaj" opens `MobileLessonDrawer` containing **compact timeline +
  `CourseSidebar`**.

### >1024px (two column) — unchanged

Left `CourseSidebar` column + `LessonReader` with the inline `HistoricalTimeline`
in its full horizontal form. No visual change on desktop.

## Implementation

### New — `apps/web` (colocated with the lesson route)

Kept in `apps/web` for consistency with the Phase 4 precedent (the mobile
course-outline trigger has always lived in the lesson page, not `ui-web`). Can be
promoted to `@learn365/ui-web` later if it gets reused.

1. **`LessonContextHeader.tsx`** — presentational, `'use client'` not required
   (parent already is). Props:
   `backHref`, `dayNumber`, `totalDays`, `eraLabel`, `completedCount`,
   `totalLessons`, `onOpenContents`. Uses `IconArrowLeft` + `IconMenu` from
   `@learn365/ui-web`, and the `ProgressBar` primitive.
2. **`LessonContextHeader.module.css`** — two-row sticky bar (sticky under
   `--topbar-height`, same blurred translucent background as today's
   `.mobileBar`). Calm, hairline `--rule` bottom border, no shadow.

### Changed — `apps/web`

3. **`LessonPageClient.tsx`**
   - Replace the `.mobileBar` markup with `<LessonContextHeader …>`.
   - Change `MobileLessonDrawer` children from bare `<CourseSidebar>` to a
     `.drawerContents` flex column: `<HistoricalTimeline variant="compact" …>` +
     `<CourseSidebar …>`.
   - `eraStats` / `eraHref` already computed here — reused for the drawer
     timeline.
4. **`LessonPageClient.module.css`**
   - Remove `.mobileBar` / `.outlineButton` / `.mobileBarMeta` (moved into the
     new component's CSS).
   - Add `.drawerContents` (flex column: compact timeline `flex:0 0 auto` with a
     `max-height` + `overflow-y:auto` guard so it never dominates; `CourseSidebar`
     `flex:1; min-height:0` so the outline scrolls).

### Changed — `@learn365/ui-web`

5. **`LessonReader.tsx`** — wrap `<HistoricalTimeline>` in
   `<div className={styles.timelineInline}>`.
6. **`LessonReader.module.css`** — `.timelineInline { display:none }` at
   `@media (max-width:1024px)`.
7. **`HistoricalTimeline.tsx`** — add optional `variant?: 'full' | 'compact'`
   (default `'full'`, backward compatible). `'compact'` adds a `styles.compact`
   class to the panel.
8. **`HistoricalTimeline.module.css`** — `.compact` rules: force the vertical
   journey-rail layout **regardless of viewport** (the existing vertical layout
   currently only triggers ≤720px, but the drawer is ~360px wide and can be open
   at 720–1024px), condensed row padding, drop the `yearFull` labels, lighter
   panel chrome (it already sits inside the drawer surface). The current era
   stays highlighted.
9. **`LessonHeader.tsx`** — split the eyebrow from one joined string into
   individual `<span>`s (`DAN nnn`, era, reading time, year) separated by `·`,
   so CSS can hide the now-redundant `DAN` + era spans on mobile.
10. **`LessonHeader.module.css`** — at `@media (max-width:1024px)` hide the
    `DAN` + era eyebrow spans (the sticky context header already shows them);
    keep reading time + year, which the context header does not show.

### Tests / docs

11. **`apps/web/e2e/smoke.spec.ts`** — the `lesson reader shows day, sidebar,
    timeline …` test asserts the timeline `nav` is **visible**; that fails on the
    `chromium-mobile` / `webkit-mobile` profiles once the inline timeline is
    `display:none`. Relax that one assertion to `toBeAttached()` (the `nav` is
    still in the DOM on every profile). Optionally add a light assertion that the
    "Sadržaj" button is present on mobile profiles. The reduced-motion test
    already uses `toBeAttached()` + `getComputedStyle`, which works on a
    `display:none` element — no change needed there.
12. **`MobileLessonDrawer`** — `ariaLabel` default updated from "Sadržaj kursa"
    to cover both contents (e.g. "Sadržaj i vremenska osa"). One-line change.
13. **`docs/PROJECT_STATE.md`** — add the Phase 6.7 entry.

## Out of scope / unchanged

- Desktop two-column layout, the `CourseSidebar` tree, `JumpToDay`,
  prev/next navigation, the "mark as completed" footer — all untouched.
- No data-model, routing, content, or progress-store changes.
- No new tokens → no `@learn365/ui` rebuild.

## Engineering gates

typecheck · lint · unit tests (ui-web `timelineMath` etc.) · production build ·
`validate-content` · Playwright (5 profiles) — all must stay green.

## Risks

- **Two `HistoricalTimeline` instances** (inline + drawer) — only ever one is
  rendered/visible at a time: the inline one is `display:none` ≤1024px, and the
  drawer is unmounted when closed (`MobileLessonDrawer` returns `null`). No
  duplicate landmark, negligible cost.
- **`variant="compact"` forcing vertical layout** — needs to override the
  existing `≤720px` media query cleanly; will be done with `.compact`-scoped
  rules rather than fighting the media query.
