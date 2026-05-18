# Phase 7.2 — Home hero v2 (PLAN)

**Status:** Draft, awaiting owner green-light to lock decisions and implement.
**Date:** 2026-05-18
**Predecessors:** Phase 7.1 — Trust polish shipped (editorial footer on every
route, `/o-aplikaciji`, TopBar `O aplikaciji` link restored).
**Parent references:**
- [`docs/NEXT_PHASE_RECOMMENDATION.md`](./NEXT_PHASE_RECOMMENDATION.md) §2 Pick 2
- [`docs/PHASE_7_1_PLAN.md`](./PHASE_7_1_PLAN.md) — bundle structure mirrored here
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — "Phase 7.1 — Trust polish: done" + Next step

## Why this is the next phase

The lesson reader is the visual benchmark of the product — drop-cap prose,
quiet eyebrow over the title, calm sidebar, inline journey rail. It reads
like a publication. The home page does not. Below the hero band the
`Prva lekcija / Lepenski Vir` card and the `Osam epoha / Putovanje kroz 365
dana` strip are visually thin: the eras strip in particular feels like a
band of tabs, not the centerpiece of a 365-day journey. The home hero
itself is text-only — no eyebrow (deliberately removed in 7.0d, correctly),
no date line, no ornament, no anchor in history. After Phase 7.1 the
product chrome reads as a real product; the home **content** still doesn't
match the confidence of the lesson reader. This phase closes that gap.

Caveat the recommendation doc flagged: assessment was made from source +
screenshot pack, not a live browser walkthrough. If the live read differs
from this plan once the Vercel preview is up, trust the live read and flip
back into screenshot review before merging.

---

## 1. Locked decisions

Confirmed with the owner before drafting the bundle.

### D1 — Eras rail weight: extend `HistoricalTimeline` with a `'home'` variant

The home `.eras` section currently mounts the **same** `HistoricalTimeline`
component the lesson reader uses (`HomeEraTimeline` → `HistoricalTimeline`,
default `variant='full'`). Sharing the component is correct; rendering it
identically on a 1440-wide landing page and a 760-wide lesson column is
what makes the home rail feel like a tab strip.

**Decision:** add a third variant to `HistoricalTimeline` — `variant='home'`
— that gives the rail more vertical presence on a wide landing surface
while leaving the lesson page's `'full'` variant untouched.

What changes in the `'home'` variant (concrete, from
`HistoricalTimeline.module.css`):
- **Taller panel.** Larger inner padding (`var(--space-7)` vs `var(--space-5)`).
- **Larger rail.** Rail height bumps from `2px` to `3px`; the marker grows
  from `11px` to `13px` with a slightly stronger ring.
- **Visible year labels on desktop.** Today `.yearShort` only shows on the
  band's short form and `.yearFull` is mobile-only. In `'home'`,
  `.yearShort` shows on desktop too (e.g. `9500 p.n.e.`, `~600`, `1166`)
  so the rail reads as a chronological journey, not a row of titles.
- **Stronger marker presence.** The current era's node gets the
  `--accent-soft` halo treatment that today only mobile / compact has — so
  the user's "you are here" position is visible at the desktop band level,
  not just the rail line.
- **More breathing room between bands.** `gap` and inter-band rule
  treatment tuned for landing-page weight.

What does **not** change:
- The lesson page mounts `variant='full'` (the default), unchanged.
- The mobile drawer mounts `variant='compact'`, unchanged.
- Per-era proportional widths, marker math (`timelineMath.ts`), `eraStats`
  shape, `eraHref` builder — all reused as-is.

Why this over the alternatives:
- **Reframe-the-section-without-changing-the-rail.** Rejected — the
  recommendation doc is explicit that the *rail itself* underplays the
  element; bigger headers around a tab-strip-feeling rail is the cheap
  fix, not the right one.
- **Separate `HomeJourneyRail` component.** Rejected — two rails to
  maintain, two timeline-math integrations, two places to drift. The
  variant flag is the right escape hatch and already established in this
  component (`'full' | 'compact'` exists today).

### D2 — Hero ornamentation: date / era line + Flourish

Two ornaments ship, both already in the editorial vocabulary used by the
lesson reader and `/o-aplikaciji`:

1. **Date / era caption under the title.** A small mono line that anchors
   the hero in history. Recommended copy:

   ```
   ~9500 p.n.e. → danas · 365 dana
   ```

   Format mirrors the lesson reader's eyebrow notation (`oko 9500 p.n.e.`).
   It is a **scope** statement (the full journey), not a state statement —
   it does **not** change with user progress. State is already carried by
   the CTA (`Započni kurs` / `Nastavi lekciju`) and the recommended-lesson
   card below.

   **Placement:** directly under the `<h1>`, above the lede paragraph.
   Using a caption *under* the title rather than an eyebrow *above* it
   preserves the Phase 7.0d decision to keep "History 365" out of the hero
   text (the TopBar carries the brand). This is a chronological caption,
   not a brand label — distinct register.

2. **`Flourish` between the lede and the CTA.** The existing
   `<Flourish />` primitive (`packages/ui-web/src/primitives/Flourish`),
   already used by the lesson reader and `/o-aplikaciji`, closes the
   title block before the CTA row. The component is centered on its
   container, so it will center within `.heroInner`'s 760px column — the
   left-aligned text plus a centered ornament will need a screenshot pass
   to confirm it reads as deliberate rather than misaligned. If it does
   not read right, the fallback is to constrain Flourish's container to
   the lede width and right-align it, but the default should be tried
   first.

**Rejected:** serif pull quote / opening line from Day 1. Couples the hero
to one lesson's body copy and shifts under editorial edits. Strong
editorial signal but wrong tradeoff for a landing surface that must be
stable as content evolves.

**Rejected:** text-only with rebalanced spacing. Confirmed not enough to
move the needle on "feels finished."

### D3 — Course-overview hero: one-line lede, no flourish

The course overview header today is bare:

```tsx
<header className={styles.header}>
  <Eyebrow>Kurs</Eyebrow>
  <h1 className="h1">{course.title}</h1>
</header>
```

**Decision:** add a one-paragraph lede directly under the `<h1>`, sourced
from `course.description` (already in canonical content data —
`packages/content/src/courses/istorija-srbije-365/_generated.ts:11`). No
date line, no Flourish.

Why no parity with the home ornaments:
- The course overview is a **navigation tool**, not a second landing
  surface (the existing comment in `course/[courseId]/page.tsx` makes
  this explicit). It should feel finished, not compete with the home
  hero.
- Two confident heroes back-to-back would flatten the hierarchy —
  "home is the front door, course is the deeper layer" is the read we want.
- `course.description` already exists, is warm and editorial, and the
  lede is the smallest possible change that closes the "reads slightly
  empty" feedback. No new data field, no new copy ownership.

**No `course.description` duplication risk.** The home hero uses
`HERO_DESCRIPTION` (a page-local string, deliberately warmer than the
canonical description per `page.tsx:11-18`). Course overview uses
`course.description`. They will read as similar-but-distinct — by design.

---

## 2. Scope reframe — what Home hero v2 is, and what it is not

**Home hero v2 = the home page's hero band + eras rail brought to the
same confidence level as the lesson reader, without adding new content
surfaces.**

Held as durable truth for this phase:

- The lesson reader stays the visual benchmark. Anything that does not
  read right next to a Day 1 screenshot does not ship.
- No new pages, no new routes, no new top-level components. The change
  is: one `ui-web` variant, one hero JSX tweak in `apps/web/app/page.tsx`,
  one paragraph added to the course overview header.
- No copy ownership outside the locked decisions. The hero date line, the
  course overview lede source — both fixed. Owner can iterate the date
  line copy at screenshot review (single string, single file).
- No imagery changes. The hero backdrop (parchment wash + illustration
  layer) is calibrated and stays as-is.
- No motion additions beyond what the variant inherits from existing
  transitions.

---

## 3. What this phase is NOT addressing

- **Section in breadcrumb.** Still a valid follow-up (was Pick 3 in the
  recommendation doc). Separate phase, will be numbered when picked up.
- **Hero backdrop QA pass at 360 / 768 / 1280 / 1920.** Noted in the
  recommendation doc as a one-off. Cover it in screenshot review of this
  phase opportunistically — do not promote into a phase.
- **Home current-lesson card redesign.** The `Prva lekcija / Lepenski
  Vir` card was flagged as visually thin alongside the eras strip, but
  its content is doing real work (state-aware label + lesson preview).
  Out of scope here; revisit if the home page still reads incomplete
  after this phase ships.
- **Editorial copy review.** Hero copy (`HERO_DESCRIPTION`) stays as-is.
- **Backend / .NET.** Phase 8 territory; not started until home reads at
  lesson-reader quality.

---

## 4. Phase 7.2 bundle

Three sub-bundles, ordered smallest-to-largest blast radius. Per the 7.1
cadence, all three ship inside **one PR** as separate commits — one
screenshot review at the end covers the whole pass; any single piece can
be reverted in isolation.

### 7.2a — Home hero ornamentation (date line + Flourish)

**Goal:** the home hero gains a chronological anchor and a closing
ornament without losing its calm.

**Files modified (2):**
- `apps/web/app/page.tsx` — inside `.heroInner`, add a `<p>` (mono caption
  class) directly under `<h1>` with the scope line
  `~9500 p.n.e. → danas · 365 dana`, and add `<Flourish />` between the
  lede and `<HomeHeroCta />`. Import `Flourish` from `@learn365/ui-web`.
- `apps/web/app/page.module.css` — small additions:
  - `.heroDateLine` (or similar) — mono font, `--muted` or `--faint`
    colour, tabular-nums, sits under the title with `var(--space-2)` top
    margin. Tighten the `.heroInner` `gap` if the new caption disrupts
    the existing rhythm.
  - Wrapper rule around the Flourish if alignment needs constraint (try
    without first — Flourish is self-contained).

**Unchanged:** `HomeHeroCta`, `HomeCurrentLessonCard`, hero backdrop,
HERO_DESCRIPTION copy. No new copy file — the date line is a one-shot
constant inline in `page.tsx` (single occurrence, no risk of drift).

**Why it's safe:** purely additive within one file's hero block. The
worst case at screenshot review is "Flourish reads centred when the rest
is left-aligned" — fall back to constraining its container width. The
single commit reverts trivially.

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Screenshots: home at 360 / 768 / 1280 / 1920 — caption legibility, no
  layout shift in the hero band, Flourish alignment reads as deliberate,
  the cream readability overlay still keeps text dominant over the
  illustration.
- No new Playwright assertion needed (visual change only); the existing
  home smoke continues to pass.

### 7.2b — `HistoricalTimeline` `'home'` variant + mount on Home

**Goal:** the home eras rail reads as the centerpiece of a 365-day
journey, while the lesson page rail and the mobile drawer's compact
variant stay byte-for-byte unchanged.

**Files modified (≈3):**
- `packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.tsx`
  — widen the `variant` prop type to `'full' | 'compact' | 'home'`.
  Extend `rootClass` to apply `${styles.home}` when `variant === 'home'`.
  No other JSX change; marker math and band rendering reused as-is.
- `packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.module.css`
  — new `.home`-scoped rule block, mirroring the `.compact` block's
  structure:
  - `.home .panel` — bumped padding, possibly slightly wider gap.
  - `.home .rail` — `height: 3px`, marker `width/height: 13px` with a
    stronger `--accent-soft` halo.
  - `.home .bandItem` / `.home .band` — increased vertical padding so the
    bands feel like landing-page weight rather than tab-strip weight.
  - `.home .yearShort { display: inline }` so the year reads on desktop
    too. (Today desktop hides `.yearShort` only above 720px? — check at
    implementation; the rule is currently scoped to mobile only via
    `display: none` in `.yearFull` and lives as default-visible
    `.yearShort`. Confirm the actual mobile/desktop behaviour by reading
    the file again at implementation time and pin the rule accordingly.)
  - `.home .current .node` — apply the `--accent-soft` ring so the
    user's "you are here" desktop band is visible at a glance.
  - `.home` rules **must not** override anything inside `@media
    (max-width: 720px)` — the mobile vertical rail behaviour is correct
    today and inherits from the un-variant'd styles. Test by toggling
    DevTools to 375px on the home page and confirming the mobile layout
    is identical to before.
- `apps/web/app/_components/HomeEraTimeline.tsx` — pass
  `variant="home"` to `<HistoricalTimeline />`. Single line change.

**Unchanged:**
- Lesson page mount (`/course/[courseId]/lesson/[lessonId]/page.tsx` and
  its components) — default `variant='full'`, no prop change.
- `MobileLessonDrawer` mount — explicit `variant='compact'`, no prop
  change.
- `HistoricalTimeline.tsx`'s public type ergonomics — adding a third
  literal to a union is non-breaking for existing call sites.

**Why it's safe:** all CSS additions are scoped under `.home`. Existing
selectors are untouched. The default `variant='full'` keeps the lesson
page rendering bit-for-bit the same. Lower bound on regression: nil
beyond the home page itself.

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Screenshots: home eras rail at 360 / 768 / 1280 / 1920. Side-by-side
  comparison with the lesson page's `'full'` rail to confirm the home
  variant reads as "weightier sibling" not "different component."
- Mobile regression: confirm `.bands` still rotates vertical at ≤720px
  (the home variant must not break the existing mobile media-query
  behaviour). The mobile vertical rail is the highest-risk regression
  surface here.
- Playwright smoke continues to pass (no new selectors, the rail is
  still a `<nav aria-label="Vremenska osa epoha">`).

### 7.2c — Course overview lede

**Goal:** the course overview hero stops reading empty without competing
with the home hero.

**Files modified (2):**
- `apps/web/app/course/[courseId]/page.tsx` — inside the existing
  `<header className={styles.header}>`, add a `<p className="body
  ...">{course.description}</p>` directly under the `<h1>`. No new
  imports, no new components.
- `apps/web/app/course/[courseId]/page.module.css` — small additions to
  `.header` (or a new `.lede` rule): cap the lede width at
  `var(--reading-col)` so it doesn't run the full shell width on 1920,
  set top spacing relative to the h1, and confirm the existing
  CourseProgress card's spacing is unaffected (the `.header` block today
  ends at the h1; adding a paragraph below it changes the block's
  height — verify the section gap below still reads).

**Unchanged:** `CourseOverviewProgress`, `CourseOverviewEras`,
`CourseSidebar`, any accordion behaviour.

**Why it's safe:** one paragraph added under a heading. The lede is
sourced from existing canonical data (`course.description` — a long,
already-edited Serbian paragraph that fits the editorial register).

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Screenshots: course overview at 360 / 768 / 1280 / 1920 — lede
  legibility, no awkward gap above CourseProgress, full
  `course.description` paragraph reads at the reading-column width.
- Playwright smoke continues to pass; no selector changes.

---

## 5. Engineering gates per sub-bundle

Each commit (7.2a → 7.2b → 7.2c) passes locally before the next is
layered on top. Final PR gates run against the full bundle:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (Vitest — no new unit tests planned; the variant is pure
  CSS-class branching, no math change)
- `pnpm build`
- `pnpm validate-content` (no content changes; sanity check only)
- `pnpm test:e2e` (Playwright — no new assertions planned; existing
  home / course / lesson smoke must continue to pass)

---

## 6. How to proceed

1. **Owner reviews this plan** and green-lights or flips any locked
   decision. Decisions D1–D3 came from the question round; if any read
   wrong on a second pass, flip now — much cheaper than at screenshot
   review.
2. **I open `feat/phase-7-2-home-hero-v2` off `main`** and layer three
   commits: 7.2a → 7.2b → 7.2c. Each commit passes the engineering
   gates before the next is added.
3. **I push and open a draft PR** so the Vercel preview deploy
   generates a live URL.
4. **Owner previews the live site** — home and course at desktop +
   mobile, side-by-side with the lesson reader for confidence-parity
   check — and either approves or calls out anything that doesn't read
   right. If a single sub-bundle misses, that commit reverts cleanly;
   the others stay.
5. **On approval the PR merges**, `PROJECT_STATE.md` is updated with a
   `Phase 7.2 — Home hero v2: done` section, and the phase is closed.
6. **Next-phase candidate after 7.2:** Section in breadcrumb
   (recommendation doc §2 Pick 3) is the cleanest next step — small,
   real clarity win on the lesson page. After that, Phase 8 (Backend /
   .NET) becomes viable per `BACKEND_STRATEGY.md`.

---

## 7. Out-of-scope reminders & housekeeping

This plan deliberately does **not** touch:

- Editorial color / type / motion tokens — calibrated, working.
- The hero illustration / backdrop layers.
- The home current-lesson card (`HomeCurrentLessonCard`) — content is
  doing real work; visual treatment can be revisited after this phase
  if the home page still reads incomplete.
- The lesson reader hero / inline timeline — the visual benchmark, do
  not move it.
- The TopBar, the Footer, `/o-aplikaciji` — Phase 7.1 territory, stable.
- The MobileLessonDrawer's compact timeline variant — unchanged.
- Authored lesson content — separate workflow.
- Anything in `apps/api` or backend — Phase 8 territory.
- Legal pages, locale switching — out of v1.

**Housekeeping (not blocking, surface here so it isn't lost):**

- **Production contact email.** `apps/web/app/o-aplikaciji/_copy.ts`
  still ships `CONTACT_EMAIL = 'kontakt@history365.app'` as a
  placeholder. Must be swapped for the real address before public
  launch. Already noted in `PROJECT_STATE.md` "Next step"; carried here
  as a reminder so it isn't forgotten while attention is on the home
  page. Not a blocker for Home hero v2 and intentionally not bundled
  into this phase — it is a one-line copy swap that can ship in any
  follow-up PR.

---

## 8. Current status (2026-05-18)

Branch `feat/phase-7-2-home-hero-v2` pushed to `origin`, four commits
ahead of `main`: this plan doc + 7.2a + 7.2b + 7.2c.

Engineering gates run locally, all green:
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
- `pnpm validate-content` (365 lessons, 37 sections, 8 eras)
- `pnpm --filter @learn365/web test:e2e` — full Playwright matrix
  (chromium / firefox / webkit × desktop / mobile). One webkit infra
  flake on first run (browser-launch lifecycle, not content); passed
  cleanly on re-run.

**Not yet done — picks up in the next session:**

1. **Open the draft PR.** The `gh` CLI on this machine was not
   authenticated, so the `gh pr create` call failed. Either run
   `gh auth login` and re-issue, or open by hand via
   <https://github.com/pavlekukric/learn365/pull/new/feat/phase-7-2-home-hero-v2>.
   Suggested PR title: `Phase 7.2 — Home hero v2`. The PR body can
   reuse the structure from this plan's §4 (bundle) and §7
   (housekeeping); the "Vercel preview live walk" item from this plan's
   §6 step 4 becomes the test-plan checklist on the PR.
2. **Vercel preview live walk** — home + course at 360 / 768 / 1280 /
   1920, side-by-side with the lesson reader for confidence-parity
   check. Specific spots worth eyeballing:
   - Centered `<Flourish />` inside the 760px-capped `.heroInner`
     reads as deliberate, not misaligned (fallback if not: constrain
     its container width).
   - Home eras rail on ≤720px is identical to before (the `'home'`
     overrides are gated to `min-width: 721px`, but worth confirming).
   - Course-overview lede doesn't crowd the CourseProgress card on
     small viewports.
3. **On approval, merge and update `PROJECT_STATE.md`** with a
   `Phase 7.2 — Home hero v2: done` section following the 7.1 pattern.
