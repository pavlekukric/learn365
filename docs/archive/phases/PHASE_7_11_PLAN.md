# Phase 7.11 — Reading comfort (bookmarks + reading-progress QA)

**Status:** Draft, awaiting owner sign-off on the locked decisions below.
**Date:** 2026-05-19
**Predecessors:**

- Phase 7.10 + 7.12-a merged 2026-05-19 (PR #20, commit `7fb1d18`) — lesson trust scaffolding + `next/image` figure renderer.
- [`docs/ROADMAP_PRE_PHASE_8.md`](../ROADMAP_PRE_PHASE_8.md) §E — Bundle E (this phase).
- [`HANDOFF.md`](../HANDOFF.md) — next-step pointer names Phase 7.11 as the next pick.

This is the detailed plan for Bundle E of the pre-Phase-8 roadmap. It is written one bundle at a time, per the locked process in the roadmap.

---

## Surprising finding from inspection

The roadmap calls `ReadingProgress.tsx` a "stub" to be wired. **It is not.** The component at [`apps/web/app/course/[courseId]/lesson/[lessonId]/ReadingProgress.tsx`](../apps/web/app/course/[courseId]/lesson/[lessonId]/ReadingProgress.tsx) is fully implemented (rAF-coalesced scroll listener, scaleX transform, hides on non-scrollable pages) and is already rendered at [`LessonPageClient.tsx:199`](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx#L199).

That collapses the phase to **one feature (bookmarks) plus a small QA pass on the existing hairline**. The plan is scoped accordingly.

---

## Goal

Make long lessons feel comfortable on 390 px screens by adding a save-for-later affordance on the lesson reader, plus a "Sačuvane lekcije" surface on the course overview, both backed by a `BookmarkStorage` adapter that mirrors `ProgressStorage` (same swap-seam pattern, ready for Phase 8).

## Out of scope

- Highlights / notes (explicit post-MVP in roadmap §E).
- Cross-device sync (waits for Phase 8 backend).
- Bookmark folders, tags, sort orders.
- A separate `/sacuvano` route — the surface is inline on the course overview.
- Re-implementing the reading-progress hairline — it already exists. Only a QA pass to confirm the bar.
- Streaks, recall, audio narration — all explicit V1 exclusions in `CLAUDE.md`.

---

## Locked decisions (owner sign-off needed before code)

These six items need explicit owner confirmation before any production code is written. The defaults below are the recommended choice with reasoning.

### L1 — Where the bookmark toggle visually lives

**Recommendation:** Inside [`packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx`](../packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx), positioned at the top-right of the header block (visually paired with the title, above the lede). Always visible on all viewports.

**Why:**

- `LessonHeader` is the one surface present on every viewport (the `LessonContextHeader` sticky bar only appears at ≤1024 px; the `MarkAsCompletedButton` lives in the footer, which is the wrong moment for "save for later").
- Top-right of the title block matches the editorial-reading precedent (Medium, NYT Cooking, Pocket) — readers look there for save / share affordances.
- Placeholder lessons would get the toggle suppressed for the same reason `LessonHeader` already suppresses the eyebrow on placeholders.

**Alternatives considered:**

- `LessonContextHeader` — rejected, not present on desktop.
- Next to `MarkAsCompletedButton` in the footer — rejected, fires after the user has already read, so "save for later" loses its meaning.
- `LessonReader` row above the breadcrumbs — rejected, breaks the established header→body→footer rhythm.

### L2 — `BookmarkStorage` shape: separate store, mirror `ProgressStorage` exactly

**Recommendation:** New module `packages/core/src/bookmarks/` mirroring the existing `progress/` module structure:

- `bookmarks/types.ts` — `BookmarkStorage` interface (identical to `ProgressStorage`), `CourseBookmarks { lessonIds: ReadonlySet<LessonId>; updatedAt: string }`, `BookmarkState`, `BookmarkActions`, `BookmarkStoreState`. Constants: `BOOKMARKS_STORAGE_KEY = 'learn365:bookmarks:v1'`, `BOOKMARKS_SCHEMA_VERSION = 1`.
- `bookmarks/store.ts` — `createBookmarkStore(options)`, single action `toggleBookmark(courseId, lessonId)`, plus `clearCourse(courseId)` for parity with `resetCourse`. Same Set↔array JSON replacer/reviver as the progress store.
- `bookmarks/selectors.ts` — `isBookmarked(state, courseId, lessonId): boolean`, `bookmarkedLessonIds(state, courseId): ReadonlyArray<LessonId>`, `bookmarkCount(state, courseId): number`.
- `bookmarks/index.ts` — barrel re-export.
- `packages/core/src/index.ts` — append `export * from './bookmarks/index.js';`.

Separate store (not a slice of the progress store) so the Phase 8 backend can choose to ship a `/api/progress` endpoint first and a `/api/bookmarks` endpoint later, without forcing them into the same payload. Mirrors the swap-seam pattern that has already paid off twice.

**Adapter:** `apps/web/lib/bookmarks/localStorageAdapter.ts` — copy-paste-adapt of the existing `apps/web/lib/progress/localStorageAdapter.ts`. Same SSR-safe shape.

**Provider:** `apps/web/lib/bookmarks/BookmarkStoreProvider.tsx` — copy-paste-adapt of `ProgressStoreProvider`. New context, new `useBookmarkStore` hook.

**Provider wiring:** wrap the existing `<ProgressStoreProvider>` in the root layout (`apps/web/app/layout.tsx`) with `<BookmarkStoreProvider>`. Order does not matter — they're independent.

### L3 — "Sačuvane lekcije" placement + empty state

**Recommendation:**

- Renders on the course overview page, slotted **between `CourseOverviewProgress` and the "Sadržaj" eras section**, so it's visible the moment a returning user lands on the page.
- **Renders nothing when the list is empty.** No empty-state card, no "ovde će se pojaviti vaše sačuvane lekcije" copy.

**Why empty-render:** matches the "no generic fallback" rule established in Phase 7.10 (the trust line). The bookmark icon in the lesson header is the discovery surface; the course overview is where users *return to* their saves, not where they learn the feature exists.

**Component:** new `apps/web/app/course/[courseId]/_components/CourseOverviewBookmarks.tsx` (client component, reads from `useBookmarkStore`). Visual register: matches `CourseOverviewProgress` card framing (same `shell`-style block), with a tight 3-column grid of small lesson cards on desktop, single column on mobile. Each card shows: `DAN NNN` mono kicker, lesson title (one line, ellipsis), era label (small muted), and click navigates to the lesson. Max ~50 entries is more than realistic ceiling; no virtualization.

**Visual reuse:** prefer reusing `CourseCard` styling vocabulary or extracting a small `BookmarkedLessonCard` primitive. Decision deferred to implementation — favor the smaller surface that doesn't require touching `CourseCard`.

### L4 — Icon shape

**Recommendation:** New `packages/ui-web/src/icons/IconBookmark.tsx`. Two states via a `filled?: boolean` prop:

- Unfilled (default): outline-only path, `stroke="currentColor"`, `strokeWidth={1.6}`, `fill="none"` — matches `IconCheck.tsx` stroke vocabulary exactly.
- Filled: same path, `fill="currentColor"`, `stroke="currentColor"`, `strokeWidth={1.6}`.

Single component, prop-driven, so the toggle's `aria-pressed` state has a 1:1 visual mapping. Add to `packages/ui-web/src/icons/index.ts`.

### L5 — Toggle button a11y + label

**Recommendation:** `<button type="button" aria-pressed={isBookmarked} aria-label={isBookmarked ? 'Ukloni iz sačuvanih' : 'Sačuvaj lekciju'}>`. No tooltip in v1 (Editorial direction is calm; tooltips on icon-only buttons are noise). The button is reachable via Tab on every lesson, in the natural reading order (title → toggle → lede).

### L6 — ReadingProgress QA bar

**Recommendation:** The component is already in production. Phase 7.11 verifies, not implements:

- Manual QA: 360, 768, 1024, 1280, 1920 widths on a long authored lesson (e.g. Day 1).
- Confirm `transform-origin: left center` reads correctly under RTL — not relevant for Serbian Latin, but checked once and noted.
- Confirm the hairline stays at `scaleX(0)` and is non-interactive when the page is single-viewport (placeholder lesson).
- Confirm `z-index: 50` does not collide with the sticky TopBar (TopBar's z-index will need a one-line check; the bar should sit at or above the TopBar's bottom edge).
- If any of the above fail, file a follow-up commit in this PR — but do not invent issues.

No new tests for the existing component. Adding regression tests for already-shipped code is out of scope.

---

## File-level bundle

A single PR with two clean commits.

### Commit 1 — `packages/core` bookmarks module + tests

- New: `packages/core/src/bookmarks/types.ts`
- New: `packages/core/src/bookmarks/store.ts`
- New: `packages/core/src/bookmarks/selectors.ts`
- New: `packages/core/src/bookmarks/index.ts`
- New: `packages/core/src/bookmarks/store.test.ts` — mirror of `progress/store.test.ts` (toggle, persist as array, rehydrate as Set, clearCourse drops one course only).
- New: `packages/core/src/bookmarks/selectors.test.ts` — `isBookmarked`, `bookmarkedLessonIds` (with stable order — insertion order via Set iteration), `bookmarkCount`.
- Edit: `packages/core/src/index.ts` — add `export * from './bookmarks/index.js';`.

### Commit 2 — Web wiring + UI

- New: `apps/web/lib/bookmarks/localStorageAdapter.ts`
- New: `apps/web/lib/bookmarks/BookmarkStoreProvider.tsx`
- Edit: `apps/web/app/layout.tsx` — wrap children with `<BookmarkStoreProvider>`.
- New: `packages/ui-web/src/icons/IconBookmark.tsx`
- Edit: `packages/ui-web/src/icons/index.ts` — re-export `IconBookmark`.
- Edit: `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` — accept `bookmarkAction?: { isBookmarked: boolean; onToggle: () => void } | undefined` prop; render the toggle in the top-right when present and `isPlaceholder !== true`. Default (no prop) preserves existing behavior — important so component tests and the `design/cloud-design-v1/` prototype don't break.
- Edit: `packages/ui-web/src/lesson/LessonHeader/LessonHeader.module.css` — add header-grid + toggle styles.
- Edit: `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` — accept `bookmarkAction?` prop, pass through to `LessonHeader`.
- Edit: `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — read `isBookmarked` + `toggleBookmark` from `useBookmarkStore`, build `bookmarkAction`, pass to `<LessonReader>`. Suppressed for placeholders by `LessonHeader` itself.
- New: `apps/web/app/course/[courseId]/_components/CourseOverviewBookmarks.tsx`
- New: `apps/web/app/course/[courseId]/_components/CourseOverviewBookmarks.module.css`
- Edit: `apps/web/app/course/[courseId]/page.tsx` — slot `<CourseOverviewBookmarks courseId={course.id} />` between `<CourseOverviewProgress>` and the `Sadržaj` `<section>`.

### Tests

- Unit: `packages/core/src/bookmarks/store.test.ts` and `selectors.test.ts` (above).
- No new web/component tests — the Playwright `smoke.spec.ts` is the existing safety net for "page renders, doesn't throw". One new Playwright assertion: after toggling the bookmark on a lesson, navigate to the course overview and assert the bookmarked lesson appears in `CourseOverviewBookmarks`.
- Existing `screenshot.spec.ts` (if present) will need a re-baseline pass for any page whose visual diff changes. Course overview and lesson reader will both diff — expected.

### Verification gates

1. `pnpm -w typecheck` clean.
2. `pnpm -w build` clean.
3. `pnpm -w test` clean (new bookmark tests added, no regressions in progress tests).
4. `pnpm -w lint` clean.
5. Vercel preview: walk fresh user → save 3 lessons across 2 eras → reload → confirm persistence → open course overview → confirm 3 cards visible → unsave one from the lesson page → confirm course overview reflects.
6. Mobile breakpoint (360 px): toggle is reachable, has 44 px hit target, doesn't shove the title down. Bookmarks list reads single-column.
7. Existing reading-progress hairline QA per L6.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| `LessonHeader` prop shape change breaks the `design/cloud-design-v1/` prototype copy. | Prop is optional with absent-default = no toggle. Prototype is unaffected. |
| `BookmarkStore` rehydration race: course overview renders before localStorage has been read. | Already proven mitigation: zustand `persist` rehydrates synchronously for sync storage, plus our adapter is sync. The existing `ProgressStoreProvider` follows the same pattern and has not produced rehydration bugs. |
| Bookmark list grows past a comfortable size. | Realistic ceiling is single-digit-tens; no virtualization needed. If a user bookmarks 100+ lessons we have a different problem. |
| Existing `<ReadingProgress />` `z-index: 50` collides with TopBar on some surface. | L6 QA bar catches this; one-line fix if needed. |
| `apps/web/app/layout.tsx` wrapping order causes provider re-mount. | New provider wraps the tree at root, sibling-of-not-nested-in `<ProgressStoreProvider>` doesn't matter since both use stable refs. |
| Bookmarks become a stealth "favorites" feature users expect to sync to backend on day 1 of Phase 8. | The swap seam is already there (`BookmarkStorage` interface). Phase 8 plan can decide ship order. Not a blocker for 7.11. |

---

## What this phase is NOT

- **Not a redesign of the lesson header.** The toggle slots into existing geometry; the title, eyebrow, lede, trust-line, Flourish all stay exactly as they are.
- **Not a content migration.** No lesson JSON files are touched.
- **Not a schema change.** `packages/content/src/types.ts` is not edited. Bookmarks are pure user state; they live in `@learn365/core`, not in content.
- **Not a backend prep phase.** The `BookmarkStorage` interface is shaped for the future swap, but no API contract, no migration helper, no telemetry hooks are added now.

---

## Definition of done

- User opens a lesson, clicks the bookmark icon in the top-right of the header, sees the icon fill in, navigates away, returns, finds the icon still filled.
- User saves several lessons, opens the course overview, sees a "Sačuvane lekcije" block listing them with day-number kickers, titles, era labels, in stable insertion order.
- User has zero bookmarks → the course overview shows no "Sačuvane lekcije" block at all (no empty-state copy).
- Placeholder lessons have no bookmark toggle.
- Reading-progress hairline QA confirmed at 360 / 768 / 1024 / 1280 / 1920; no regression filed.
- `pnpm -w typecheck && pnpm -w build && pnpm -w test && pnpm -w lint` all clean.
- One smoke assertion: bookmark → course overview shows it.

---

## How to proceed

1. **Owner reviews this plan**, particularly the six locked decisions (L1–L6). The toggle placement (L1) and the empty-state behavior (L3) are the two that most shape the user-visible result.
2. On green-light, work proceeds **commit 1 first** (pure `@learn365/core` package + tests, no UI yet — easy to review in isolation), then **commit 2** (web + ui-web changes).
3. PR opens against `main`. Standard squash merge. Effort estimate: 1.5 days from green-light to merge, per roadmap §E.
4. On merge: `PROJECT_STATE.md` gains a "Phase 7.11 — done" section, `HANDOFF.md` refreshes the next-step pointer (to Phase 7.12-b — era-opener figures), this plan moves into `docs/archive/phases/`.
