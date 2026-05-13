# QA Checklist

End-of-phase regression checks. Used by the QA Engineer agent (see `docs/AGENTS.md`) and as the gate before any phase is marked complete.

Every item must be verifiable manually in under a minute, or automated.

---

## A. Phase-end gates

### Phase 1 — Content & core packages

- [ ] `pnpm --filter @learn365/content validate` exits 0.
- [ ] Day numbers cover 1..365, unique, contiguous.
- [ ] Every Section's lessons all share the same `eraId` as the Section itself.
- [ ] Section `[startDay, endDay]` ranges partition the course with no gaps or overlaps.
- [ ] Era year ranges are monotonically increasing.
- [ ] `ProgressStore` unit tests pass: toggle, persist roundtrip, reset, selectors.
- [ ] Storage adapter contract is implemented and tested with an in-memory fake.

### Phase 2 — Web shell

- [ ] App renders at `/` without runtime errors.
- [ ] Fonts (Spectral, Inter, JetBrains Mono) load with no FOUT longer than ~100 ms.
- [ ] OKLCH renders correctly in Chrome, Safari, Firefox (latest).
- [ ] sRGB fallback verified by disabling `oklch()` in DevTools and confirming the page is still legible.
- [ ] Top bar is sticky and translucent on scroll.
- [ ] Layout shell respects `shell-max` (1440 px) and centers above that.

### Phase 3 — Web components

- [ ] Each primitive has hover, focus-visible, and disabled states verified by hand or snapshot.
- [ ] `ProgressBar` and `ProgressRing` animate from 0 to N% smoothly.
- [ ] `CompletionDot` renders all three states with correct color tokens.
- [ ] Sidebar accordion: chevron rotates, section open/close animation, contains-current highlight.
- [ ] Historical timeline marker positions correctly within the current Era's band for boundary lessons (first lesson of Era, last lesson of Era).
- [ ] Drawer opens, locks body scroll, traps focus, closes on backdrop, closes on ESC.

### Phase 4 — Web screens

- [ ] Home: hero, how-it-works, era preview, CTA all render and respond to the primary CTA.
- [ ] Course overview: progress card shows correct counts; era list shows all 8 entries with per-era completion.
- [ ] Lesson reader desktop: sidebar + reader column align; reading column maxes at 660 px.
- [ ] Lesson reader mobile: sticky day strip, drawer button, drawer reveal, lesson body legible.
- [ ] Breadcrumbs path is correct on every screen.
- [ ] Mark-as-completed flow: click → green check appears in sidebar → top bar progress increments → course overview progress increments after navigation back.
- [ ] Prev/next: at course start, prev is disabled; at course end, next is disabled.

### Phase 5 — Web polish & QA

- [ ] Lighthouse desktop: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- [ ] Lighthouse mobile: Performance ≥ 90.
- [ ] Playwright E2E: open Home → enter course → open Day 1 → mark complete → reload → progress persists.
- [ ] Playwright visual snapshots: Home, Course overview, Lesson reader at 1440, 1024, 768, 375 widths.
- [ ] Keyboard tour: Tab through Home, Course overview, Lesson reader — every interactive element is reachable, focus order is logical, focus ring is visible.
- [ ] Screen reader smoke (VoiceOver or NVDA): Top bar nav reads with current-page state, breadcrumbs read as a list, completion button announces pressed state.
- [ ] `prefers-reduced-motion: reduce` collapses timeline marker and progress bar to instant changes.

---

## B. Cross-cutting checks

### Completion & progress

- [ ] Completing a lesson updates the sidebar dot immediately (optimistic, no network).
- [ ] Completing a lesson increments the top-bar counter and the course-overview ring.
- [ ] Unmarking a completed lesson decrements counters everywhere.
- [ ] Section's `done/total` counter updates when any lesson in it changes state.
- [ ] Era progress updates when any of its sections change.
- [ ] After full page reload, `completedLessonIds` and `lastOpenedLessonId` are restored from `localStorage`.
- [ ] Resetting course progress clears every counter back to 0.

### Sidebar & navigation

- [ ] Opening a lesson auto-expands its Section's accordion.
- [ ] Active lesson row scrolls into view if outside the viewport on lesson change.
- [ ] Clicking a sibling lesson updates the URL and the reader content without a full reload.
- [ ] Browser back / forward navigates lessons correctly.
- [ ] Direct deep-link to `/course/.../lesson/<id>` renders the correct lesson.
- [ ] Invalid lesson ID renders a "lesson not found" fallback, not a crash.

### Historical timeline

- [ ] Marker is correctly positioned for the first lesson of each Era (at the band's left edge).
- [ ] Marker is correctly positioned for the last lesson of each Era (at the band's right edge).
- [ ] Clicking an Era band jumps to that Era's first lesson and updates the URL.
- [ ] Current Era band has accent color and heavier tick.

### Mobile responsive

- [ ] At ≤ 860 px: sidebar disappears from layout; "Sadržaj" button appears in sticky sub-bar.
- [ ] Drawer covers ≤ 86% width or ≤ 360 px, whichever is smaller.
- [ ] All touch targets ≥ 44 × 44 px.
- [ ] Hero and course-overview headings reflow to a single column.
- [ ] Lesson reader fonts step down (title 30 px, body 17 px).
- [ ] No horizontal scroll on any screen.

### Accessibility

- [ ] All images have non-empty `alt` text (placeholders use `aria-hidden="true"` when purely decorative).
- [ ] Focus-visible outline is present on every interactive element.
- [ ] No reliance on color alone for state (completion uses dot + check; active uses bar + tint).
- [ ] `aria-current="page"` on the active lesson and current nav link.
- [ ] Drawer focus trap and ESC handling verified.
- [ ] Color contrast verified: `ink` on `bg`, `ink2` on `bg`, `muted` on `bg`, `accent` on `bg`, `bg` on `accent`, `bg` on `completed`.
- [ ] Headings form a logical outline (one `h1` per page; reader uses `h1` for the lesson title and `h2` for inline section headings).

### Performance

- [ ] First lesson route TTI ≤ 2 s on a throttled 4G profile.
- [ ] Sidebar scroll stays smooth (≥ 50 fps) on a mid-range Android (Pixel 5 baseline).
- [ ] Lesson route bundle size budget: ≤ 250 KB JS gzipped (excluding fonts).
- [ ] No layout shift on font load (cumulative shift ≤ 0.05).

### Content invariants

- [ ] Build fails if any lesson references an unknown `sectionId` or `eraId`.
- [ ] Build fails if total lesson count diverges from `course.totalLessons` (365).
- [ ] Build fails if any lesson body has zero blocks.

---

## C. Pre-release manual sweep

Before tagging a release:

- [ ] Disable network and reload — progress restores from localStorage; pages render at least to the cached extent.
- [ ] Enable private/incognito mode — flow still works; the UX copy clarifies progress is per-device.
- [ ] Test in Safari Technology Preview, Chrome stable, Firefox stable.
- [ ] Test at 100% zoom and at 200% zoom — no overflow, focus visible, content legible.
- [ ] Test with system dark mode enabled — the app continues to render Editorial light theme correctly (we are not honoring dark mode in v1; verify nothing breaks).
- [ ] Visit every Era's first and last lesson — timeline marker positions correctly, era short label is right.
- [ ] Confirm no `console.error` or `console.warn` across the full app.

---

## D. Recurring smoke (run weekly during active development)

- [ ] App boots, three screens render, primary CTAs respond.
- [ ] One lesson can be opened, completed, and the completion persists across reload.
- [ ] Lighthouse score has not regressed by more than 3 points on any axis.
