# Phase 7.4 — Course-page eras as editorial blocks (PLAN)

**Status:** Draft, awaiting owner green-light to implement.
**Date:** 2026-05-19
**Predecessors:** Phase 7.3 — Section in breadcrumb shipped (lesson page
breadcrumb chain extended from 4 to 5 items with the section crumb
mirroring the `eraHref` "navigate to first lesson" pattern). Sidebar
era→section indent guide shipped as a post-7.3 fix.
**Parent references:**
- [`docs/UX_AUDIT_CURRENT_UI.md`](./UX_AUDIT_CURRENT_UI.md) §4.4 — "Eras
  on course page: collapse section-accordion blocks behind a *Vidi N
  odeljaka* disclosure, so the 8 era descriptions read as 8 editorial
  blocks first." The audit recommendation is the seed for this phase.
- [`docs/PHASE_7_0_PLAN.md`](./PHASE_7_0_PLAN.md) §6 — listed this as
  "Phase 7.4 — Course-page eras as editorial blocks." Title preserved.
- [`docs/PHASE_7_3_PLAN.md`](./PHASE_7_3_PLAN.md) — bundle structure
  mirrored here.
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — "Phase 7.3 — done" +
  "Next step" entry naming this phase as the strongest pre-Phase-8
  candidate.

## Why this is the next phase

A live audit of the post-7.1 / 7.2 / 7.3 / indent-fix build (screenshot
pack regenerated 2026-05-19 against `next start --port 3100`) confirmed
that the **course overview is now visibly the densest of the three
primary pages**. The lesson reader reads like a publication; the home
page (post-7.2) is calm and confident; the course overview is a wall of
hierarchy:

- 8 `CourseCard` rows (era eyebrow + title + years + progress bar) —
  each ~88px tall.
- On fresh state, Era I auto-expands into an inline description
  paragraph + 7 stacked section accordion rows (each section ~52px,
  so ~365px of inner panel) + the first section also auto-expands
  into 7 lesson rows.
- The remaining 7 eras stack below as bare `CourseCard`s with no
  editorial content — they read as nav rows, not editorial blocks.

The audit §4.4 finding is sharper than "add a disclosure." The
disclosure already exists in `CourseOverviewEras` — each era has a
`Pokaži odeljke · N` / `Sakrij odeljke` toggle ([line 211-242](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L211-L242)).
The real problem the audit named is two-part:

1. The era *description paragraph* lives inside the disclosure ([line 245](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L245)).
   So closed eras have no editorial copy — they're navigation chrome.
   Audit §4.4: *"make the era's description paragraph the visible part
   by default."*
2. The default-open behavior auto-expands Era I + its first section on
   fresh state via `findActiveLocation` (which returns the first lesson
   of the course when there is no `lastOpenedLessonId` and no completed
   set — see [`packages/core/src/navigation/index.ts:61-86`](../packages/core/src/navigation/index.ts#L61-L86)).
   A first-time visitor lands on a fully-expanded Era I rather than 8
   calm editorial blocks.

This phase fixes both. Closed eras become editorial blocks (eyebrow +
title + years + 1–2 sentence description + progress); fresh-state eras
default closed; "where would I start?" stays answered by the
`CourseProgress` card above (already state-aware) and by each
`CourseCard`'s href.

Low blast radius: one primitive prop, one component effect adjustment,
one CSS rule removal. One PR, three commits, one screenshot review.

---

## 1. Locked decisions

Confirmed with the owner before drafting the bundle on 2026-05-19, after
showing two preview mockups for D1 and three for D2.

### D1 — Era description lives inside `CourseCard` (always visible)

The `CourseCard` primitive ([`packages/ui-web/src/course/CourseCard/CourseCard.tsx`](../packages/ui-web/src/course/CourseCard/CourseCard.tsx))
gains an optional `description` prop. When provided, it renders as a
body paragraph inside the card surface, between the title block and the
progress block. Closed eras now read as:

```
EPOHA II
Nemanjićka Srbija                                1166–1371
Dinastija koja je od malog kneževstva izgradila veliku
srednjovekovnu državu — od Stefana Nemanje do carstva
Dušana Silnog.
0 / 60   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           →
   Pokaži odeljke · 4
```

The description is sourced from `era.description`, which already exists
on the canonical `Era` type ([`packages/content/src/types.ts:40`](../packages/content/src/types.ts#L40))
and is authored in `_generated.ts` for all 8 eras. No new copy, no new
data field, no new content workflow.

**Why this over a sibling paragraph between card and toggle.** A
paragraph outside the card surface reads as a caption *on* the card
rather than *part of* it, breaking the "8 editorial blocks" register.
Inside the card the description anchors to the title and shares its
breathing room. The CourseCard is a single-purpose component used only
on the course overview (verified — `grep CourseCard` returns the
primitive's own files plus a single usage in `CourseOverviewEras.tsx`),
so the prop addition has no other call-site impact.

**Why not keep the current placement (inside disclosure).** Audit §4.4
explicitly calls this out as the wrong shape. Leaving the description
hidden until disclosure leaves closed eras as bare navigation rows —
the audit finding stays unaddressed.

### D2 — All eras closed by default on fresh state

When the user has no progress signal — both
`lastOpenedLessonId === null` and the completed-set is null or empty —
`CourseOverviewEras` skips the `findActiveLocation` auto-open. Page
renders as 8 closed editorial blocks immediately.

Once any progress exists (the user has opened or completed at least one
lesson), today's behavior returns: the era and section containing the
active lesson auto-open. The `findActiveLocation` selector stays
unchanged — it's used elsewhere (notably the lesson sidebar's
"where am I" defaulting) and changing its semantics would have
side-effects. The fix lives in `CourseOverviewEras` only, as a guard
inside the two `useEffect` blocks at [line 170-178](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L170-L178).

**Why not "auto-open Era I, not its first section" hybrid.** Still
leaves 7 stacked closed section rows on first scroll. Doesn't change the
"reads dense" perception meaningfully.

**Why not leave today's behavior.** D1 alone (description on closed
era) would help, but the auto-expanded Era I would still dominate the
fresh-state first impression and the editorial-blocks effect would only
land for returning users.

**"Where do I start?" affordance is preserved.** The
`CourseProgress` card above the eras already shows a state-aware start /
continue action; each `CourseCard` is itself a `<Link>` to its first
lesson. Closing the eras by default removes nothing the user needs to
get going.

### D3 — One PR, three commits, no Playwright assertion expansion

Mirrors the 7.3 cadence. Three sub-bundles ordered smallest-to-largest
blast radius:

- 7.4a: `CourseCard` primitive gains the optional `description` prop +
  CSS slot. No call-site change yet (prop is optional). Zero behavior
  change shipped in isolation; safe to revert.
- 7.4b: `CourseOverviewEras` passes `era.description` to `CourseCard`
  and removes the duplicate `<p className={styles.eraDescription}>`
  from inside the disclosure. Closed eras now render with description;
  open eras no longer double-print it.
- 7.4c: Fresh-state default-open guard added to the two `useEffect`
  blocks in `CourseOverviewEras`. Page renders 8 closed blocks on first
  load when the user has no progress.

One screenshot review at the end covers all three commits. Each commit
reverts cleanly.

No new Playwright assertion. The existing breadcrumb / completion smoke
covers the lesson + course flow; this phase changes the resting state of
the course overview, not the interactive contract. The
`Pokaži odeljke` toggle, completion counting, and lesson-row state logic
are all untouched.

---

## 2. Scope reframe — what 7.4 is, and what it is not

**Phase 7.4 = closed eras become editorial blocks, and fresh-state
renders as 8 calm blocks.**

Held as durable truth for this phase:

- The audit §4.4 finding is the only target. Anything outside it stays
  out of scope.
- `CourseCard` is a primitive — its prop addition is optional and
  every existing prop signature is preserved. No breaking change for
  the (currently single) call site.
- `findActiveLocation` is not touched. The fix is local to
  `CourseOverviewEras`.
- The disclosure mechanism itself stays. The `Pokaži odeljke · N`
  toggle, single-open behavior across sections, and inner
  `SectionAccordionRow` are unchanged.
- No new copy. `era.description` is already authored for all 8 eras.
- No content model change. `Era.description` already exists.
- No new components, no new routes.

---

## 3. What this phase is NOT addressing

- **Mobile lesson sticky chrome scroll-collapse** (Phase 7.5
  candidate). Separate, mobile-only, will be picked up after 7.4.
- **Course page scroll restore** (Phase 7.6 candidate). Quality-of-life
  win; separate phase.
- **Hero backdrop QA pass at 360 / 768 / 1280 / 1920.** One-off check,
  not a phase. Cover opportunistically during the 7.4 screenshot
  review if time permits.
- **`CourseCard` visual redesign.** The card surface, padding, grid
  template, hover state, and status icon stay as-is. Only the
  description slot is added.
- **Sidebar `EraGroup` impact.** The sidebar tree does not use
  `CourseCard`; it has its own `EraGroup` component (post-indent-fix).
  This phase does not touch it.
- **Era description copy review.** The 8 descriptions in
  `_generated.ts` are kept as-is for this phase. If any description
  reads too long or too marketing-y once visible on the closed card,
  flag it for a separate editorial pass.
- **Section-level cards.** Sections continue to render as accordion
  rows inside the disclosure (the audit suggestion was era-level
  blocks, not section-level cards — sections remain a navigational
  drill-down).

---

## 4. File-level bundle

Three commits inside one PR. Each commit passes
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` before the
next is added.

### 7.4a — `CourseCard` gains optional `description` prop

**Goal:** the primitive supports an editorial description slot, with
zero behaviour change for existing call sites.

**Files modified (2):**
- [`packages/ui-web/src/course/CourseCard/CourseCard.tsx`](../packages/ui-web/src/course/CourseCard/CourseCard.tsx)
  — add `description?: string` to `CourseCardProps`. When provided,
  render a `<span className={`body ${styles.description}`}>` between
  `.titleBlock` and `.progressBlock`. (`<span>` not `<p>` because
  `CourseCard` is a `<Link>` — paragraphs cannot be descendants of
  interactive elements; the span is styled with paragraph-like
  line-height + spacing.)
- [`packages/ui-web/src/course/CourseCard/CourseCard.module.css`](../packages/ui-web/src/course/CourseCard/CourseCard.module.css)
  — small additions:
  - `.description` rule: `var(--ink-2)` colour, `var(--reading-col)`-ish
    max-width, top margin via `gap` from `.titleBlock`. Tabular-nums
    not needed (this is prose, not metrics).
  - Update `.card` `grid-template-columns` so the description sits
    inside the `1fr` middle column above the years label. May need to
    promote the middle column from a `<span>` to a wrapper that
    contains title + years + description and let it stack vertically.
  - `@media (max-width: 720px)` rule: description wraps inline under
    title in the stacked layout; tighten its colour or font-size if
    it competes with the title in single-column. Mobile preview at
    screenshot review will confirm.

**Unchanged:** existing props (`era`, `totalLessons`, `completedLessons`,
`isCurrent`, `isAllDone`, `href`), card hover/focus styles, status icon
animation, `:focus-visible` outline.

**Why it's safe:** the new prop is optional. The existing single call
site in `CourseOverviewEras.tsx` does not pass `description` at this
commit, so the rendered output is byte-identical to today. Commit
verifies independently.

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Visual: no change yet — the prop is wired but unused. Confirm via the
  screenshot pack after 7.4b that the slot renders cleanly.

### 7.4b — Wire era description into `CourseCard` + remove disclosure duplicate

**Goal:** closed era cards now carry the editorial description; open
eras stop double-printing it.

**Files modified (2):**
- [`apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx`](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx)
  — two adjacent changes:
  - At [line 203-210](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L203-L210),
    pass `description={era.description}` to `<CourseCard … />`.
  - At [line 244-246](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L244-L246),
    delete the `<p className={`body ${styles.eraDescription}`}>{era.description}</p>`
    line so the disclosure panel starts directly with the
    `<ul className={styles.sections}>`.
- [`apps/web/app/course/[courseId]/_components/CourseOverviewEras.module.css`](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.module.css)
  — remove the now-unused `.eraDescription` rule. Verify no other
  selectors reference it (`grep eraDescription`).

**Unchanged:** disclosure toggle, sections accordion, lesson rows,
progress logic.

**Why it's safe:** the description text is the same string; only its
location moves (from inside disclosure to inside card). Visually, the
closed era gains content; the open era loses a duplicate of the same
content. No new state, no new effect, no new dependency.

**Verification:**
- Standard gates.
- Screenshot pack run — focus on:
  - `desktop-course-overview.png`: 8 era cards each carry a description
    paragraph; closed eras read as editorial blocks.
  - `desktop-course-overview-with-progress.png`: same — and the
    auto-opened era still reads clean (no duplicate description).
  - `mobile-course-overview.png` + `mobile-course-overview-with-progress.png`:
    description wraps gracefully under the title in the stacked
    layout; doesn't compete with the title for prominence.

### 7.4c — Fresh-state default-open guard

**Goal:** when the user has no progress, the page renders 8 closed era
blocks instead of auto-expanding Era I.

**Files modified (1):**
- [`apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx`](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx)
  — derive a `hasRealProgress` boolean alongside `active`:

  ```tsx
  const hasRealProgress =
    lastId !== null || (completedSet !== null && completedSet.size > 0);
  ```

  Then guard the two existing effects at [line 170-178](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L170-L178):

  ```tsx
  useEffect(() => {
    if (userToggledEra) return;
    if (!hasRealProgress) {
      setOpenEraId(null);
      return;
    }
    setOpenEraId(active?.eraId ?? null);
  }, [active?.eraId, userToggledEra, hasRealProgress]);

  useEffect(() => {
    if (userToggledSection) return;
    if (!hasRealProgress) {
      setOpenSectionId(null);
      return;
    }
    setOpenSectionId(active?.sectionId ?? null);
  }, [active?.sectionId, userToggledSection, hasRealProgress]);
  ```

  Note: the existing `setUserToggledEra(true)` / `setUserToggledSection(true)`
  in the era-toggle `onClick` ([line 217-218](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L217-L218))
  continues to work — once the user manually opens any era, their
  intent wins and stays sticky for the session.

**Unchanged:** the `setOpenSectionId(next !== null && next === active?.eraId ? active.sectionId : null)`
inline logic on era-toggle ([line 224-228](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L224-L228))
stays — when a fresh-state user manually opens an era, if it happens to
be Era I (where `active` defaults), the first section will still
auto-open inside. That's the right behaviour: manual open is an
explicit "show me this" signal.

**Why it's safe:** one boolean + two early returns. No change to
findActiveLocation, the progress store, the persisted localStorage
shape, or the disclosure mechanics. Reverts as one diff.

**Verification:**
- Standard gates.
- Manual: load `/course/istorija-srbije-365` in a fresh browser
  (clear localStorage) — page renders 8 closed era blocks. Click
  Era I header → it opens normally; click again → it closes.
- Manual: seed progress (open Day 7 → reload) — Era I + the relevant
  section auto-open as today. The active-lesson default-open behaviour
  is unaffected for returning users.
- Manual: with seeded progress, click `Pokaži odeljke` on Era II
  manually, then reload — the section that was opened stays open
  *only* because `userToggledEra` is true for the session; on next
  page load (state resets) the auto-open follows the active lesson
  again. This matches the existing 7.3-era behaviour; no regression.
- Screenshot pack — `desktop-course-overview.png` and
  `mobile-course-overview.png` (both fresh-state) show 8 closed
  blocks. `*-with-progress` shots stay as today.

---

## 5. Verification (whole phase)

Per the 7.x cadence:

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green at
  each commit.
- Existing Playwright smoke (8 tests across 5 browser profiles) passes
  unchanged — the course overview is not a test target for the smoke;
  the home, lesson, and about pages are.
- Screenshot pack regenerated locally via `pnpm screenshots` and the
  four course-overview shots reviewed against today's baseline:
  - `desktop-course-overview.png` (fresh) — 8 closed editorial blocks
  - `desktop-course-overview-with-progress.png` — active era open with
    description on card (not duplicated in disclosure)
  - `mobile-course-overview.png` (fresh) — same, stacked layout
  - `mobile-course-overview-with-progress.png` — same, with progress
- Live audit at the local dev server (`pnpm dev`, port 3000) before
  marking the PR ready: confirm reading hierarchy on a real browser at
  desktop and mobile widths.

---

## 6. Risks

- **CourseCard becomes too tall on mobile.** The description paragraph
  adds vertical height inside the card. At 360px width, a 2-sentence
  description wraps to ~4 lines, making the card ~140px tall vs ~88px
  today. With 8 cards stacked, that's ~1100px of card surface alone
  before the open era's disclosure. Mitigation: at screenshot review,
  consider clamping the description to 2 lines via
  `-webkit-line-clamp: 2` on mobile only (CSS rule already used
  elsewhere in the codebase for similar treatments — verify).
- **Description colour competes with title.** Default `var(--ink-2)`
  may read too dark. Mitigation: tune at screenshot review; the
  lesson reader's secondary body colour is the reference.
- **First-time visitor confusion.** "Where do I start?" might feel
  less obvious without an auto-expanded era. Mitigation: the
  `CourseProgress` card above the eras already shows a state-aware
  start action, and the `CourseCard` itself is a `<Link>` to the era's
  first lesson — both unchanged. The fresh-state page is calm but not
  silent.

---

## 7. How to proceed

1. **Owner gives green-light to implement.** (Decisions D1 + D2 + D3
   already locked above.)
2. **Open `feat/phase-7-4-course-editorial-blocks` off `main`** and
   layer three commits: 7.4a → 7.4b → 7.4c. Each commit passes
   typecheck + lint + unit tests + build before the next is added.
3. **Push and open a draft PR** so the Vercel preview deploy generates
   a live URL.
4. **Owner previews the live site** — course overview fresh state,
   course overview with seeded progress, desktop + mobile. Either
   approves or calls out anything that doesn't read right. If a single
   commit misses, that commit reverts cleanly; the others stay.
5. **On approval the PR merges**, `PROJECT_STATE.md` gains a
   "Phase 7.4 — Course editorial blocks: done" section, and the
   "Next step" entry is refreshed to name Phase 7.5 (mobile sticky
   chrome scroll-collapse) as the next candidate — or, if the owner
   declares web v1 visually approved at this point, points at Phase 8
   (Backend / .NET) per `docs/BACKEND_STRATEGY.md`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- `findActiveLocation` semantics or the `@learn365/core` selectors.
- The `CourseProgress` card or any home / lesson surface.
- Sidebar `EraGroup` / `SectionAccordion` / `LessonNavItem`.
- Editorial color / type / motion tokens.
- The `SectionAccordionRow` inside the disclosure.
- Anything in `apps/api` or backend.
- `era.description` copy itself — kept as-is for this phase.
