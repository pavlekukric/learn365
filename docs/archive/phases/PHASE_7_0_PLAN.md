# Phase 7.0 — Premium clarity declutter (PLAN)

**Status:** Decisions locked 2026-05-15. Awaiting owner green-light to implement.
**Date:** 2026-05-15
**Parent audit:** [`docs/UX_AUDIT_CURRENT_UI.md`](./UX_AUDIT_CURRENT_UI.md)
**Predecessors:** Phase 6.8 (lesson page declutter, 7 sub-bundles) and Phase 6.9
(course hero + lesson toolbar swap + upcoming-state polish).

## Locked decisions (2026-05-15)

1. **JumpToDay → REMOVE** from the course page. The component file in
   `packages/ui-web/src/course/JumpToDay/` stays on disk (self-contained,
   reusable if ever wanted); only the import + render slot on the course page
   go away.
2. **Home hero identity → option (a)**: drop the hero eyebrow entirely. Keep
   h1 = `Istorija Srbije 365`. Brand identity is held by the TopBar.
3. **Cadence → one bundled PR.** All four sub-bundles ship as one PR with one
   screenshot review at the end. The sub-bundle structure below is kept as
   commit-level organisation inside that PR — easy to revert any single piece
   if it doesn't read right.

---

## 1. Scope reframe (2026-05-15)

The audit produced 11 sections of findings. Some of those findings were
implicitly motivated by the **current dev state** — 6 of 365 lessons authored,
359 placeholders — and would partly evaporate the moment the content fill is
complete. This phase explicitly removes those items from scope.

Held as durable truth for this phase:

- Lesson content is owned by a separate content-generation / editorial
  workflow. A different agent is writing the lessons; a human reviewer gates
  them before production.
- **Production will not ship until all 365 lessons are authored.**
- Current placeholders are dev artefacts. They are acceptable as long as they
  do not look broken. Phase 6.9's upcoming card meets that bar.

The Phase 7.0 bundle therefore targets only **UI/UX polish that would still be
the right thing to do with every day populated** — clarity, premium feel,
redundant chrome, navigation flow, trust signal that does not depend on
content density.

Phase 6.8 + 6.9 already shipped most of the previous review's findings. This
plan is the next, smaller pass — pure declutter and label tightening, no new
visual design.

---

## 2. What this phase is NOT addressing

Explicitly out of scope, deferred to the content / editorial workflow:

- **Prev/Next "next available authored lesson" smart-skip.** With full content
  the immediate next lesson is always real; the strip's current behaviour is
  correct. (Audit §5.4.)
- **Placeholder-state visual polish beyond Phase 6.9.** The "Ova lekcija je u
  pripremi" card is honest and editorial. No further polish needed; the state
  goes away at launch. (Audit §5.7.)
- **Authored lesson historical review / sources / editorial voice.** Separate
  manual gate per `PROJECT_STATE.md`. (Audit §6.4.)
- **Commercial framing tied to content density.** Pricing, monetisation,
  "would users pay" — not a UI question and not addressable until content is
  complete. (Audit §7.)
- **CourseProgress "Day 2 promise" risk for fresh users.** With full content
  Day 2 is real. The "two parallel rows" framing problem in §4.2 *survives*
  the content fill, though, and is included below for the clarity reason
  alone.

---

## 3. What survives full content — the durable issues this phase targets

These are the audit findings that would still be the right thing to fix even
if every one of the 365 lessons were authored today. They are the load-bearing
list for Phase 7.0.

| # | Surface | Issue | Audit ref | Type |
|---|---|---|---|---|
| A | Lesson sidebar | Header (`KURS / course title`) duplicates the TopBar | §5.1 | remove |
| B | Lesson reader | Three locator strips above the title: breadcrumb + timeline + LessonHeader eyebrow | §5.2 | compress |
| C | Lesson reader | `Označi kao završeno` ↔ `Označeno kao završeno` swaps both label *and* icon side | §5.5 | label tighten |
| D | Course header | Always-on `Počni od Dana 001 →` link contradicts the state-aware CourseProgress card below | §4.1 | remove |
| E | Course progress | Empty-state shows two equal-weight rows (ZA POČETAK + SLEDEĆE); only the first is the action | §4.2 | hierarchy |
| F | Course eras | JumpToDay form widget on an editorial page | §4.3 | remove |
| G | Home hero | Two product names within 80px — resolved by dropping the eyebrow | §3.2 | identity |
| H | Home eras section | "Osam epoha / Putovanje kroz 365 dana / 8-eras intro paragraph" says the same thing three times | §3.5 | copy |
| I | Home hero CTA | `365 lekcija · oko 8 min dnevno` meta repeats info from the body | §3.3 | remove |
| J | Home current-lesson card | Verbose `Preporučeno za početak` idle label | §3.4 | copy |
| K | TopBar | Disabled `O aplikaciji` link broadcasts unfinished product on every page | §3.1 | nav cleanup |

Trust polish (audit §6.5) is a real and durable concern, but **building
`/o-aplikaciji` + an editorial footer is a separate phase (7.1)** because it
requires new components, page design, and a footer that touches every route.
Phase 7.0 only handles item K — *removing* the disabled nav link — as a
holdover until 7.1 ships the real page.

---

## 4. Phase 7.0 bundle

Four sub-bundles, ordered by surface. Per the locked cadence decision, all
four ship inside **one PR** as separate commits — one screenshot review at
the end covers the whole pass. The commit boundaries are kept so any single
piece can be reverted in isolation if it doesn't read right. No new
components, no new visual design.

### 7.0a — Lesson page tightening (items A, B, C)

**Goal:** The lesson page reader column begins with breadcrumbs + the timeline
+ the title. The sidebar begins with the era tree. The completion button
behaves like one confident control.

**Files touched (≈5):**
- `packages/ui-web/src/course/CourseSidebar/CourseSidebar.tsx` — drop the
  `.header` block (KURS kicker + course title). Sidebar renders era tree
  directly.
- `packages/ui-web/src/course/CourseSidebar/CourseSidebar.module.css` —
  drop `.header`, `.kicker`, `.courseTitle` rules. Tighten `.body` top
  padding now that there's no header above it.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` — compress the
  eyebrow. Current: `DAN 001 · Praistorija i rani srednji vek · 8 min čitanja
  · oko 9500. p.n.e.`. New: `8 min čitanja · oko 9500. p.n.e.`. Drop the
  `eyebrowContext` span entirely. DAN + era are already in the breadcrumb and
  in the timeline.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.module.css` — drop
  the `.eyebrowContext` rule and the ≤1024px hide that pairs with it.
- `packages/ui-web/src/lesson/MarkAsCompletedButton/MarkAsCompletedButton.tsx` —
  labels become `Završi` (idle) → `Završeno` (pressed). Icon stays on the
  trailing side in both states (no swap). Width stable.

**Unchanged:** breadcrumbs themselves, the timeline panel, the lesson body,
the previous/next nav, ARIA on the button (`aria-pressed`), the green
accent for the pressed state.

**Why it's safe:** All removals. The information the user loses (sidebar
course title; DAN + era in the eyebrow) is present elsewhere on the same
screen — TopBar, breadcrumbs, timeline.

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Screenshots: lesson Day 1, desktop 1440 + mobile 375, before / after.
- Manual: rapid-click `Završi` ↔ `Završeno` and confirm no horizontal
  layout shift.

### 7.0b — Course page header + JumpToDay (items D, E, F)

**Goal:** The course page header is calm (eyebrow + title only). The
CourseProgress card is the only "where to go next" surface. The eras-section
heading is one editorial line, no form widget.

**Files touched (≈4):**
- `apps/web/app/course/[courseId]/page.tsx` — remove the
  `<Link>` block for "Počni od Dana 001 →" from the page header. Remove the
  `<JumpToDay>` import and the `.jump` slot in the eras-section header.
- `apps/web/app/course/[courseId]/page.module.css` — drop `.startLink`,
  `.jump`, and the `flex` layout that paired the heading with the jump
  widget. `.erasHeader` collapses to `.erasHeading`.
- `packages/ui-web/src/course/CourseProgress/CourseProgress.tsx` — for
  `hasStarted === false`, suppress the `SLEDEĆE` row. The empty-state shows
  one confident row: the ring + `ZA POČETAK · …` row + label. (Returning
  users keep both rows, unchanged.)
- `packages/ui-web/src/course/JumpToDay/` — **leave the component file
  intact.** It's a self-contained widget that can come back if a future
  product decision wants it. Removing the import from the course page is
  enough; no need to delete code.

**Unchanged:** the course header eyebrow + h1, the CourseProgress ring math,
the era → section → lesson tree below.

**Knock-on:** the course page becomes visibly calmer. The hero is two lines
(eyebrow + h1), the progress card is one canonical action, the eras section
opens with a clean h2.

**Verification:**
- typecheck + lint + test + build.
- `pnpm test:e2e` — Playwright suite has assertions on the course-page
  layout; the JumpToDay assertion (if any) needs removal.
- Screenshots: course overview, fresh user vs returning user, desktop +
  mobile.

### 7.0c — Home hero identity + eras section + CTA copy (items G, H, I, J)

**Goal:** The home hero is one confident block. The eras section opens with
something new, not a third restatement of "8 eras / 365 days".

**Files touched (≈3):**
- `apps/web/app/page.tsx`:
  - Remove the `<Eyebrow>` line in the hero (the `HERO_EYEBROW` constant).
  - Decide between (i) drop the `ERAS_INTRO` paragraph entirely, *or* (ii)
    rewrite the eras-section h2 from `Putovanje kroz 365 dana` to e.g.
    `Od Lepenskog Vira do današnjeg dana`. **Recommendation: drop the
    intro paragraph** (eyebrow + h2 + the timeline beneath is already three
    layers of "this is the journey").
- `apps/web/app/_components/HomeHeroCta.tsx`:
  - Drop the `<span className="tiny mono">{totalLessons} lekcija · oko
    {minutesPerLesson} min dnevno</span>` line. The body description above
    already says "365 kratkih lekcija"; the topbar capsule already shows
    `X / 365`. Three restatements collapses to one.
- `apps/web/app/_components/HomeCurrentLessonCard.tsx`:
  - `LABEL_BY_STATE.idle` becomes `Prva lekcija` (was `Preporučeno za
    početak`). Active and done labels stay.

**Unchanged:** the hero h1 (course title), the hero body description, the
hero atmospheric backdrop, the CTA button label (state-aware:
`Započni kurs` / `Nastavi lekciju`), the era timeline component itself.

**Verification:**
- typecheck + lint + test + build.
- Screenshots: home, desktop 1440 + mobile 375, before / after. Confirm
  hero is one tight block, eras section opens cleanly, current-lesson card
  reads as confident.

### 7.0d — TopBar nav cleanup (item K)

**Goal:** Remove the disabled `O aplikaciji` nav span. The real
`/o-aplikaciji` page is a Phase 7.1 deliverable; until then, nothing
broadcasts "unfinished".

**Files touched (2):**
- `packages/ui-web/src/primitives/TopBar/TopBar.tsx` — delete the
  `<span className={styles.disabledLink} aria-disabled="true" title="Uskoro">
  O aplikaciji</span>` block.
- `packages/ui-web/src/primitives/TopBar/TopBar.module.css` — drop the
  `.disabledLink` rule and the related mobile-hide rule.

**Unchanged:** Brand, Početna link, Kurs link, the progress capsule, every
mobile breakpoint behaviour. The change is purely subtractive.

**Note:** When Phase 7.1 ships, the `O aplikaciji` link returns as a real
`<Link href="/o-aplikaciji">` — the visual treatment from the deleted span
will not be needed (it was the *disabled* state we're removing, not the
active state).

**Verification:**
- typecheck + lint + test + build.
- Screenshots: any page (TopBar is identical across all routes), desktop +
  mobile.

---

## 5. Engineering gates per sub-bundle

Each commit (7.0a–7.0d) must pass locally before the next is layered on top.
Final PR gates run against the full bundle:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (Vitest)
- `pnpm build`
- `pnpm validate-content` (no content changes in this phase; sanity check
  only)
- `pnpm test:e2e` (Playwright — 7.0b is the one that likely needs assertion
  updates; the others are too small to break it)

---

## 6. What's deferred to subsequent UI/UX phases (not this PR)

Roughly ordered by premium-per-effort. Each is large enough to merit its own
plan doc when it's the next thing on deck.

- **Phase 7.1 — Trust polish.** Build `/o-aplikaciji` (mission, editorial
  standard, sources note, editor, contact). Add a minimal editorial footer
  with imprint + sources line. Restore the TopBar's `O aplikaciji` as a real
  `<Link>`. Audit §3.1 + §6.5.
- **Phase 7.2 — Section as a navigational level.** Add Section to the
  breadcrumb (or replace Era with Section) and decide on `#section-id`
  anchor routing on the course page so the crumb is navigable. Audit §5.3.
- **Phase 7.3 — Mobile lesson sticky chrome scroll-collapse.** Hide the
  bottom meta row of `LessonContextHeader` after the user scrolls past the
  title (intersection observer). Audit §5.6.
- **Phase 7.4 — Course-page eras as editorial blocks.** Hide section
  accordions behind a `Vidi N odeljaka` disclosure so the course page reads
  as 8 editorial blocks with optional drill-down. Audit §4.4.
- **Phase 7.5 — Course page scroll restore.** Next.js scroll-restoration
  tweak so back-navigation from a lesson returns the user to the section
  accordion they came from, not the page top. Audit §4.6.
- **Hero backdrop QA pass** at 360 / 768 / 1280 / 1920. Not a phase, a
  one-off check. Audit §3.8.

---

## 7. How to proceed

1. **You give green-light to implement.** (Decisions and cadence are locked.)
2. **I open `feat/phase-7-0-premium-clarity-declutter` off `main`** and layer
   four commits: 7.0a → 7.0b → 7.0c → 7.0d. Each commit passes typecheck +
   lint + unit tests + build before the next is added.
3. **I push and open a draft PR** so the Vercel preview deploy generates a
   live URL.
4. **You preview the live site** (home, course, lesson Day 1, lesson Day 2
   placeholder — desktop + mobile) and either approve or call out anything
   that doesn't read right. If a single piece misses, that commit reverts
   cleanly; the others stay.
5. **On approval the PR merges**, `PROJECT_STATE.md` is updated, and Phase
   7.0 is closed.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- Editorial color / type / motion tokens — calibrated, working.
- Hero backdrop CSS — works; flagged for QA only.
- The MobileLessonDrawer — at a good resting state after 6.8b.
- The HistoricalTimeline visual treatment — the discussion in audit §5.2 is
  about *whether* to include the inline timeline on the lesson page, not
  about its visual design. Phase 7.0a leaves the timeline in place; if
  Section 5.2 of the audit becomes a separate decision later it gets its
  own plan.
- Authored lesson content — separate content workflow.
- Prev/Next placeholder handling — separate content workflow.
- Anything in `apps/api` or backend.
