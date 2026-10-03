# Phase 7.6 — Course page scroll restore (PLAN)

**Status:** Draft, awaiting owner green-light to implement.
**Date:** 2026-05-19
**Predecessors:** Phase 7.5 — Mobile lesson sticky chrome scroll-collapse shipped
(merged 2026-05-19, PR #23, commit `4325e64`). New baseline in
`docs/PROJECT_STATE.md` § Current Baseline.
**Parent references:**

- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: Phase 7.6 — Course page scroll
  restore." Pre-existing pre-7.0 polish backlog item.
- [`docs/ROADMAP_PRE_PHASE_8.md`](../ROADMAP_PRE_PHASE_8.md) — 7.5/7.6 polish
  items preserved through the 7.7–7.12 reframe.
- [`docs/UX_REQUIREMENTS.md`](./UX_REQUIREMENTS.md) — premium / calm / editorial
  bar.

## Why this is the next phase

Returning to `/course/istorija-srbije-365` after opening a lesson drops the
reader back at the top of the page instead of where they were in the era list.
A live probe on the production build (chromium-desktop, course page
`scrollHeight` 3850 / viewport 720, scrolled to **1200** before leaving)
measured:

| Return path | Restored `scrollY` |
| --- | --- |
| Browser **back** | **130** (position lost) |
| Breadcrumb **"Kurs"** link | **0** (position lost) |

So Next.js App Router's built-in scroll restoration does **not** recover the
position here. Root cause: the course page's main content
([`CourseOverviewEras`](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx))
is a client component whose progress-driven accordion settles **after**
hydration + Zustand store hydration + its open-era/open-section effects. Next's
restoration runs against a page whose final height is not yet known, so it
misses. This is a known App Router limitation with client-rendered,
height-variable content, and it is exactly why an explicit restore that **waits
for the content to settle** is required.

Low blast radius: one new client component + the page mounting it, plus one
Playwright assertion. No content, schema, or new dependency. Effort ~half a day.

---

## 1. Locked decisions

Confirmed with the owner on 2026-05-19.

### D1 — Restore on any return within the browser session

The saved scroll position is restored whenever the course page mounts and a
position was saved earlier **this browser session** — browser back, breadcrumb
`Kurs`, or TopBar `Kurs`. It reads as "resume where you left off." A fresh first
visit (no saved value yet) lands at the top, as does the first load in a new
tab/session.

Rejected: "only restore when arriving directly from a lesson." It matches the
HANDOFF wording more literally but needs previous-path tracking for marginal
benefit; the owner picked the simpler, more forgiving behaviour.

**Storage:** `sessionStorage`, key `learn365:course-scroll:<courseId>`.
`sessionStorage` (not `localStorage`) is deliberate — the position is a
within-session affordance, not durable state, and it auto-clears on tab close so
a brand-new session starts at the top. This is separate from the
`learn365:progress:v1` / `learn365:bookmarks:v1` keys and is **not** part of the
backend swap seam — it is pure view state.

### D2 — Scroll offset only; accordion shift stays out of scope

The course accordion auto-opens the era of the user's **last-opened lesson**
([`CourseOverviewEras.tsx:182`](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L182)).
Opening a lesson changes `lastOpenedLessonId`, so on return a *different* era may
be expanded than when the user left, which shifts content under a restored
offset. Phase 7.6 restores the **scroll offset only** and leaves that existing
behaviour untouched. The restored offset still lands the reader near where they
were; the interaction is flagged as known (see §6). Persisting the open
era/section accordion state is a larger, separate change and is explicitly not
part of this phase.

### D3 — Instant restore, settle-aware

Restoration is instant (no smooth scroll) to mimic native behaviour. Because the
client content height is not final at mount, the restore retries across a few
animation frames until the document is tall enough to honour the saved offset
(`scrollHeight - innerHeight >= saved`), then performs a single
`window.scrollTo(0, saved)`. A short frame/time budget caps the retries so a
genuinely shorter page (e.g. progress reset) simply scrolls as far as it can and
stops.

### D4 — One PR, single commit

Small enough for a single commit with a clean revert (delete the component +
unmount line). No sub-bundle chain.

---

## 2. Scope — what 7.6 is

**Phase 7.6 = the course overview page restores the reader's prior scroll
position on return within the session, waiting for client content to settle.**

Held as durable truth for this phase:

- Renderer scope only. No content, no schema, no new npm dependency.
- A new client component owns the save + restore; the server `page.tsx` just
  mounts it. `CourseOverviewEras` / `CourseOverviewProgress` /
  `CourseOverviewBookmarks` are unchanged.
- No change to navigation, links, breadcrumbs, or the TopBar.
- No change to the lesson reader, the `ReadingProgress` line, or the 7.5
  meta-row collapse.
- `localStorage` progress/bookmark keys are untouched; the new key is
  `sessionStorage` view state.

---

## 3. What this phase is NOT addressing

- **Accordion open-state restore.** Out of scope per D2.
- **Lesson reader scroll position.** The lesson page already streams from the
  top by design; not in scope.
- **Cross-session persistence.** Deliberately `sessionStorage`; a new session
  starts at top.
- **The "accordion follows last-opened lesson" behaviour.** Unchanged.
- **Home or About scroll restore.** Course route only.
- **Backend / `apps/api`.** N/A — this is view state, not a swap-seam concern.

---

## 4. File-level bundle

One commit inside one PR.
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` green before push.

**Files added (1):**

### New client component

- `apps/web/app/course/[courseId]/CourseScrollRestore.tsx` — a `'use client'`
  component that renders `null` and takes a `courseId` prop. It:
  - **Saves** `window.scrollY` to `sessionStorage["learn365:course-scroll:" +
    courseId]` on scroll, coalesced with `requestAnimationFrame` and a passive
    listener — the same proven pattern as
    [`ReadingProgress.tsx`](../apps/web/app/course/[courseId]/lesson/[lessonId]/ReadingProgress.tsx)
    and the 7.5 `useScrollDirection.ts`. Saving the raw value (including 0) means
    leaving from the top correctly returns to the top.
  - **Restores** once on mount: reads the saved value; if present, runs a
    settle-aware retry (rAF loop, capped at a small frame/time budget) that waits
    until `document.documentElement.scrollHeight - window.innerHeight >= saved`,
    then calls `window.scrollTo(0, saved)` once (instant). All `window` /
    `sessionStorage` access is inside the effect, so SSR is unaffected.
  - Cleans up the listener + cancels any pending frame on unmount.

  Co-located on the course route (not promoted to `@learn365/ui-web`) because it
  is route-specific view glue, mirroring how `ReadingProgress` lives beside the
  lesson page.

**Files modified (2):**

### Page mount

- [`apps/web/app/course/[courseId]/page.tsx`](../apps/web/app/course/[courseId]/page.tsx)
  — render `<CourseScrollRestore courseId={course.id} />` inside the page shell
  (it renders nothing visible). One import + one element. No other change to the
  server component.

### Playwright assertion

- [`apps/web/e2e/smoke.spec.ts`](../apps/web/e2e/smoke.spec.ts) — one new test:
  seed progress so the course page is tall, scroll to a known offset, navigate
  into a lesson, return via the breadcrumb `Kurs` link, and assert `scrollY` is
  restored to ≈ the saved offset (within a small tolerance for the settle
  retry). Mirrors the manual probe used to scope this phase. Gated to a profile
  where the page is reliably scrollable.

---

## 5. Verification (whole phase)

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
- Existing Playwright smoke passes unchanged.
- New Playwright assertion green on its target profile(s). Suite grows to **12
  tests × 5 profiles**.
- Live audit on the production build (`pnpm --filter @learn365/web build` then
  `next start`, or the Vercel preview):
  - Seed some progress, scroll the course page down, open a lesson, hit browser
    **back** → lands at the prior offset (not top, not 130).
  - Repeat returning via the breadcrumb **`Kurs`** link and the TopBar `Kurs`
    link → same restore.
  - Fresh tab / first visit → lands at top (no saved value).
  - Scroll to the very top, leave, return → returns to top (saved 0 honoured).
  - Confirm no visible "jump to top then snap down" flash beyond a single frame;
    if the flash is noticeable, tighten the restore to the earliest settle frame.
  - Re-check at 390 / 768 / 1280 widths.

---

## 6. Risks

- **Restore-vs-Next-scroll-to-top flash.** Next scrolls to top on a forward
  `Link` navigation into the course; our restore runs after and overrides it,
  which can show a one-frame top→offset jump. Mitigation: restore on the
  earliest settle frame (rAF), instant. If still visible, consider hiding the
  jump is out of scope — a single frame is acceptable and matches how many SPAs
  restore.
- **Content settles below the saved offset.** If progress changed so the page is
  now shorter than when the user left, the saved offset is unreachable. The
  settle-aware loop caps its budget and scrolls as far as possible — no infinite
  loop, no error.
- **Accordion shift (D2).** The auto-opened era can differ on return, so the
  restored offset may sit against different content. Accepted and flagged; not a
  bug introduced by this phase. If it ever reads as broken, the follow-up is the
  D2 "persist accordion state" work, tracked separately.
- **Saving on every scroll.** rAF coalescing + a passive listener keep this off
  the main thread (same cost profile as `ReadingProgress`). `sessionStorage`
  writes are synchronous but tiny (one integer); writing once per animation
  frame at most is well within budget.
- **Multiple course routes.** Keying by `courseId` keeps positions independent
  if a second course is ever added.

---

## 7. How to proceed

1. **Owner gives green-light to implement.** Decisions D1–D4 locked above.
2. **Open `feat/phase-7-6-course-scroll-restore` off `main`** and land one
   commit: `feat(web): Phase 7.6 — restore course page scroll on return`.
3. **Push and open a draft PR** so the Vercel preview deploy generates a live
   URL.
4. **Owner previews** — scroll the course list, open a lesson, return via back +
   `Kurs` link, confirm the restore feels natural and flash-free.
5. **On approval the PR merges**, `docs/PROJECT_STATE.md` gains a
   "Phase 7.6 — done" section, `HANDOFF.md` refreshes the next-step pointer
   (next backlog item: hero backdrop QA pass, or the `keyPeople` / `keyPlaces`
   consolidation phase — owner's call), and this plan moves into
   `docs/archive/phases/`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- `CourseOverviewEras` accordion state or its "follow last-opened lesson" logic.
- The lesson reader, `ReadingProgress`, or the 7.5 meta-row collapse.
- Navigation, links, breadcrumbs, or the TopBar.
- `localStorage` progress / bookmark keys or the backend swap seam.
- Any content JSON, schema, or `_generated.ts`.
- Home / About scroll behaviour.
- Anything in `apps/api` or backend.
