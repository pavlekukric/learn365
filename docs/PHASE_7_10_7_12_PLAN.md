# Phase 7.10 + 7.12 — Lesson trust scaffolding + editorial figures (PLAN)

**Status:** DRAFT — awaiting owner confirmation of D1–D7 before any
production code is written.
**Date:** 2026-05-19
**Predecessors:**

- Phase 7.9 — Progress narrative consolidation (merged 2026-05-19, PR #19,
  commit `d34a6eb`). Course overview now has one canonical journey-day row;
  Home and Course speak the same "Tvoj N. dan" register.
- Phase 7.8 + full-content corpus (merged 2026-05-19, PR #18, commit
  `76f94fe`). All 365 lessons are authored; `validate-content` reports
  `365 authored / 0 placeholder`. The lesson schema gained `subtitle`,
  `dateLabel`, `timelinePosition`, `summary`, `keyPeople`, `keyPlaces`,
  and paragraph `dropcap`.

**Parent references:**

- [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md) — Phase 7.10
  (Bundle D) + Phase 7.12 (Bundle F). Roadmap proposes shipping them in
  one editorial PR window so sources, byline, and figures land together
  with a single schema/regen pass.
- [`HANDOFF.md`](../HANDOFF.md) — current live next-step pointer; names
  this bundle as the next pick after 7.9 and flags the scope expansion
  (post-corpus, "authored" means all 365, not just the original 6 seeds).
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — Current Baseline. The
  schema additions slot alongside the post-7.8 fields without disturbing
  any existing surface.
- [`docs/CONTENT_MODEL.md`](./CONTENT_MODEL.md) and
  [`docs/CONTENT_AUTHORING.md`](./CONTENT_AUTHORING.md) — the canonical
  content contract this phase extends.

## Why this is the next phase

The post-7.9 build settles "where am I in the course?" The next gap a
paying user will read against is **credibility and editorial weight inside
the lesson itself.** Today every lesson renders:

- A title, optional subtitle, eyebrow (`8 min čitanja · oko 9500–6000.
  p. n. e.`).
- Body paragraphs / headings / quotes.
- A `MarkAsCompletedButton` and prev/next nav.

What it does *not* render:

- Any indication of who wrote or reviewed the lesson.
- Any sources for the historical claims made in the body.
- Any date the lesson was last factually reviewed.
- Any figure (the `image` `LessonBlock` exists in the schema but
  `LessonBody.tsx:42` renders it as a placeholder `<div role="img">`, not
  an actual `<img>` — so even the lessons whose JSON has imagery would
  show empty rectangles).
- The corpus fields `keyPeople` / `keyPlaces` (verified absent from every
  UI component — grep of `**/*.{ts,tsx}` returns only the type file, the
  loader, and the generated content module).

For a paid Serbian-history product, the absence of bylines, sources, and
images is the single biggest "is this a real publication?" signal a first-
time visitor reads against. Phase 7.10+7.12 lays that floor.

### The scope shift we have to confront first

The roadmap entries for 7.10 + 7.12 were written when **6** lessons were
authored. Phase 7.8's content drop made **all 365** authored. That
materially changes the bundle:

- The roadmap's "sources required on authored lessons" rule would now
  imply 365 lessons × N sources each = a multi-week curatorial job, not
  a 1.5–2 day code phase.
- The roadmap's "1–2 figures across 6 authored lessons" = 6–12 figures.
  Scaling proportionally would be 60+ figures, also a multi-week job.

So the most important decision in this plan is the **scope ceiling**:
how much of the 365 we expect to carry the trust surface in v1, and how
much ships later in opportunistic content passes. D1 below is the
proposed answer; everything downstream depends on it.

---

## 1. Locked decisions

These are the load-bearing calls. **All six are proposed; none are
locked.** Each has the recommended option first, with a brief alternative
considered.

### D1 — Scope ceiling: schema everywhere, content on a curated seed set

**Recommended (R):** Schema, validator, and UI ship for **all 365 lessons**
(so the surface is universal and consistent). Actual data — bylines,
`lastReviewedAt`, `sources[]` — is written in this PR only for a curated
**editorial seed set:** the 6 original hand-written lessons (Days 1, 7,
31, 106, 200, 305). The remaining 359 carry no byline / no
`lastReviewedAt` / no sources in v1; the UI renders nothing in their
absence (no empty `Izvori` heading, no "By: —" placeholder).

Why this is the right ceiling:

- The original 6 are the lessons most likely to be QA'd by visitors
  judging editorial quality (they're real prose, not auto-generated
  stubs — the rest of the 365 corpus is the Phase-7.8 author drop but
  none of those carried bylines / sources at authoring time).
- It avoids fake-byline syndrome (slapping `Tim History 365` on 365
  lessons nobody on the team would individually defend).
- It keeps the bundle a *phase* not a *quarter*. Content backfill
  becomes an editorial workstream that lands per-era opportunistically
  in later passes, not a v1 blocker.
- It honours the project rule from `CLAUDE.md` § "Do not implement yet"
  — we are not building admin, CMS, or AI-generated trust scaffolding.

Alternative considered: require sources on all 365 with CI enforcement
(the literal reading of the roadmap entry, written pre-corpus).
Rejected because it converts a code phase into a content phase the team
hasn't scoped, and any sources written in a rush would be worse than no
sources.

Alternative considered: defer the schema until content exists.
Rejected because we want the UI floor in production before the editorial
backfill begins — the seeds prove the surface works, and every new
authored revision can add sources from day one.

### D2 — Byline shape: `author?` + `reviewer?`, no course-wide fallback

**Recommended (R):** `Lesson.byline?: { author?: string; reviewer?:
string }`. Both fields independently optional. Rendered as a small mono
caption directly under the lesson title:

```
NAPISAO: Pavle Kukrić · UREDIO: —
```

(Exact label register: confirmed at screenshot review.) When `byline` is
absent entirely, render nothing — no placeholder, no "—". When `byline`
is present but one of the two roles is missing, render only the present
role.

Why no course-wide fallback (e.g., `Tim History 365` on every lesson by
default):

- Visitors who read attentively notice when every lesson has the same
  generic byline; it reads worse than no byline.
- The schema cost of an explicit per-lesson opt-in is negligible.
- Course-level fallback can be reintroduced cheaply later if we end up
  wanting a default; reversing course is harder.

Alternative considered: rich byline shape with `role`-typed array
(`{ role: 'author' | 'reviewer' | 'fact-checker'; name: string }[]`).
Rejected as YAGNI — two roles cover every realistic v1 case, and the
flat shape is half the schema surface.

### D3 — `lastReviewedAt`: ISO date string, rendered next to byline

**Recommended (R):** `Lesson.lastReviewedAt?: string` validated as an
ISO date (`YYYY-MM-DD`). Rendered next to the byline (or alone if no
byline is set), as `POSLEDNJI PREGLED: 19. 05. 2026.` in mono small
type. Date format is Serbian locale (`Intl.DateTimeFormat('sr-RS')`).

Validator: if present, must match `^\d{4}-\d{2}-\d{2}$` and parse to a
valid Date. No required-by relationship to `byline`.

Why a string, not a `Date`: JSON has no date type; ISO date strings
round-trip cleanly through the JSON drop-in and the generated module.

Alternative considered: ISO datetime (`YYYY-MM-DDTHH:mm:ssZ`).
Rejected — a "last reviewed" claim doesn't carry meaningful sub-day
precision and the longer string is visual noise in the codebase.

### D4 — `sources[]`: typed-kind union, rendered as `Izvori` editorial block

**Recommended (R):** `Lesson.sources?: readonly Source[]` where:

```ts
interface Source {
  readonly kind: 'book' | 'article' | 'museum' | 'archive' | 'web';
  readonly title: string;
  readonly author?: string;
  readonly year?: number;
  readonly url?: string;
}
```

Rendered as a new `<LessonSources />` block appended after the body and
before the `MarkAsCompletedButton`:

- Section heading: `Izvori` (h2, `reader-h2` class — matches body headings).
- One `<li>` per source. Format depends on kind:
  - `book` / `article`: `Author (Year). *Title*. [link if url]`
  - `museum` / `archive`: `*Title*, Institution. [link if url]`
  - `web`: `*Title*. [link]`
- `target="_blank" rel="noopener noreferrer"` on every link.
- An empty / undefined `sources` field renders nothing (no empty heading).

Validator: if `sources` is present, must be non-empty, and each entry
must have `title` non-empty and `kind` ∈ the union.

Why the typed-kind union: lets the renderer format consistently per kind
without per-source markdown authoring. Keeps citation style uniform.

Why no per-paragraph footnotes: explicitly out of scope per the roadmap.
A flat `Izvori` block is the v1 floor.

Alternative considered: free-form `sources?: readonly string[]`.
Rejected because we lose the kind-aware formatting and `url` handling,
and migrating later would be painful.

### D5 — Figures: fix the renderer first, then add 1 figure per era opener (8 figures)

**Recommended (R):** Two-part scope:

1. **Renderer fix.** `LessonBody.tsx:42` currently renders the `image`
   block as a placeholder `<div role="img" aria-label={alt} />`. Replace
   with a real `<figure>` containing `<Image>` (Next.js `next/image`) +
   `<figcaption>`. Attribution lives **in the caption string** (no new
   schema field) — e.g., `Lepenski Vir, naselje na Dunavu. Foto: Petar
   Milošević, CC BY-SA 4.0, Wikimedia Commons.` Width/height required
   (Next/Image), so each image asset needs intrinsic dimensions captured
   at curation time.

2. **One figure per era opener.** Insert one curated figure into the
   first lesson of each of the 8 eras (Day 1 — Praistorija and antika;
   Day N — Srednji vek; etc.). Public-domain or CC-BY/CC-BY-SA only;
   attribution baked into the caption. Yields 8 figures across the
   corpus — broad enough that every era opener feels editorial, narrow
   enough to ship in this PR window.

Why "era openers" specifically:

- Day-1-of-era is the lesson where a reader's interest in that period
  forms; a figure pays for itself most there.
- The 8 openers are easy to enumerate from `sections.json` (the first
  section of each era, then `dayNumber: section.startDay`).
- Avoids picking favourites among the 365 — every era is treated equally.

Why not "1–2 figures across the original 6 seed lessons" (the literal
roadmap wording):

- Three of the 6 seed lessons share an era (so era coverage is
  uneven). Era-opener selection gives uniform coverage with a similar
  effort.
- The seeds will get figures *too* if they happen to be era openers;
  Day 1 is. The remaining seeds may receive figures opportunistically
  in later passes if curation surfaces a strong candidate.

Alternative considered: figures only on the 6 seeds.
Rejected — narrower coverage for the same curation effort, and reading
the seeds back-to-back reveals which periods are "image-rich" vs.
"image-empty" inversely to historical interest.

Alternative considered: defer figure curation, ship only the renderer
fix.
Rejected because shipping an unused renderer fix means the next visitor
still reads zero figures, which is the actual user problem.

### D6 — No validator enforcement on the new fields in v1

**Recommended (R):** Schema validation only (shape, ISO date, non-empty
where present). **No CI rule that says "every authored lesson must have
sources"** — because under D1, "authored" effectively means "all 365",
and we'd be failing the build for every lesson that hasn't gone through
the editorial backfill yet.

This is a reversal of the original roadmap entry, which was written
pre-corpus and is no longer scoped correctly.

If the editorial workstream later wants to lock in "every lesson that
has been editorially reviewed must declare its `lastReviewedAt`", that
becomes a rule we add when the backfill workstream begins, not now.

Alternative considered: warn-not-fail in CI (`echo` count of unreviewed
lessons but exit 0). Reasonable, defer until the backfill workstream
exists and the number is meaningful.

### D7 — One PR; one or two small commits

Mirrors the 7.7 / 7.8 / 7.9 cadence. Proposed split:

- **7.10/12-a — Schema + UI surface, no content.** Lesson type
  additions, `<LessonSources />` component, `LessonHeader` byline + last-
  reviewed rendering, image-block renderer fix in `LessonBody.tsx`,
  validator updates, regenerated `_generated.ts`. Lands as if the 365
  lessons have these fields all-undefined — visually identical to today.

- **7.10/12-b — Editorial content drop.** Sources + byline +
  `lastReviewedAt` on the 6 seed lessons. Figures on the 8 era openers
  (curation done out-of-band; this commit lands the JSON edits, image
  assets under `apps/web/public/lessons/`, and re-runs `pnpm
  gen-content`).

If image curation runs long, ship 7.10/12-a, open a separate small PR
for 7.10/12-b once images are sourced. The schema-only PR is the floor;
content can land independently without rework.

Decision deferred to implementation time. Default: one PR.

---

## 2. Scope reframe — what 7.10 + 7.12 is, and what it is not

**Phase 7.10 + 7.12 = schema + UI floor for byline, last-reviewed,
sources, and proper figure rendering. Content backfilled on the 6 seed
lessons + 8 era openers; the remaining 351 lessons render unchanged.**

Held as durable truth for this phase:

- `packages/content/src/types.ts` gains three optional fields on `Lesson`
  (`byline`, `lastReviewedAt`, `sources`) and one new `Source` interface.
- `packages/content/src/loader/loadCourseFromFiles.ts` parses and
  validates the new fields.
- `packages/content/src/loader/validateContentFiles.ts` gains four new
  shape checks (byline shape, ISO date, source-entry shape,
  non-empty-array-if-present). No "required" rules.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` extends the
  eyebrow stack with a new sub-line for byline + last-reviewed (when
  either is present).
- `packages/ui-web/src/lesson/LessonSources/` — **new component**. Pure
  presentation, takes `sources: readonly Source[]` prop.
- `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` mounts
  `<LessonSources>` after `<LessonBody>` and before the footer (when the
  current lesson has sources).
- `packages/ui-web/src/lesson/LessonBody/LessonBody.tsx` replaces the
  image-block placeholder with a real `<figure>` + `next/image` + caption.
- `apps/web/public/lessons/` — **new directory** with 8 curated images
  (one per era opener), plus a small `README.md` documenting attribution
  + license per file.
- 6 seed lesson JSON files + 8 era-opener JSON files (some overlap —
  Day 1 is both a seed and the Era I opener) gain content.
- `packages/content/src/courses/istorija-srbije-365/_generated.ts` is
  regenerated from the new JSON.
- `corpus`-field rendering (`keyPeople` / `keyPlaces`) is **out of scope
  for this phase.** They were added in 7.8 but never wired; rendering
  them is its own consolidation question (where in the reader? in the
  sidebar? in the lesson header?) that deserves its own small phase.
  Flagged in HANDOFF rather than bundled here.
- Storage shape (`learn365:progress:v1`) is **not** changed.
- No new selector in `@learn365/core`.
- The TopBar, the course overview, Home, the historical timeline, the
  sidebar, the drawer, and the prev/next footer are **not** touched.

---

## 3. What this phase is NOT addressing

- **Per-paragraph footnotes.** Defer post-MVP. `<LessonSources />` is the
  flat `Izvori` block.
- **External link previews / OpenGraph cards in `Izvori`.** Plain links.
- **A separate `/izvori` index route.** Not in v1.
- **Course-level / era-level sources** (as opposed to per-lesson). Not
  in v1 — sources are scoped to lessons.
- **CI enforcement** that authored lessons must have sources (D6).
- **`keyPeople` / `keyPlaces` rendering.** See §2 — separate concern.
- **AI-generated source extraction** from lesson body text. Explicit V1
  exclusion in `CLAUDE.md` ("AI content generation").
- **Image CDN / hosting infrastructure.** Assets live under
  `apps/web/public/lessons/` and are served by Vercel's static CDN. No
  S3, no Cloudinary, no image optimization pipeline beyond `next/image`'s
  built-in handling.
- **Backfilling sources on the 359 non-seed authored lessons.** Becomes
  an editorial workstream after this phase.
- **Reading-comfort affordances** (scroll progress, bookmark). Those are
  Phase 7.11 — the next phase after this one.

---

## 4. File-level bundle

One PR; either one commit or split per D7. Each commit passes
`pnpm typecheck && pnpm lint && pnpm test && pnpm build &&
pnpm validate-content` before the next is added.

### Commit 7.10/12-a — Schema + UI surface

**Files modified (4):**

- **[`packages/content/src/types.ts`](../packages/content/src/types.ts)**
  - Add `Source` interface (the union-kind shape from D4).
  - Add `byline?`, `lastReviewedAt?`, `sources?` to `Lesson` (all
    optional, all readonly).
  - Export `Source` from the package index.

- **[`packages/content/src/loader/loadCourseFromFiles.ts`](../packages/content/src/loader/loadCourseFromFiles.ts)**
  - Parse the three new fields from per-lesson JSON. Type-narrowing
    matches the existing pattern used for `subtitle`, `dateLabel`,
    `keyPeople`, etc. Reject unknown values (e.g., `kind` outside the
    union) with a `ContentLoadError` carrying the lesson id + field name.

- **[`packages/content/src/loader/validateContentFiles.ts`](../packages/content/src/loader/validateContentFiles.ts)**
  - New check: if `byline` present, at least one of `author` / `reviewer`
    must be a non-empty string.
  - New check: if `lastReviewedAt` present, must match
    `/^\d{4}-\d{2}-\d{2}$/` and parse to a finite `Date`.
  - New check: if `sources` present, must be non-empty array; each entry
    must have non-empty `title`; `kind` must be in the union; `url` (if
    present) must parse via `new URL(...)`; `year` (if present) must be
    a finite integer.
  - No "required on authored" rule (per D6).

- **[`packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx`](../packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx)**
  - After the existing eyebrow (`reading time · date`), add a second
    eyebrow line rendering byline + last-reviewed when either is set.
    Shape:
    ```tsx
    {(lesson.byline || lesson.lastReviewedAt) ? (
      <p className={`tiny mono ${styles.eyebrow}`}>{...}</p>
    ) : null}
    ```
  - Format helper inline (don't extract a new util — likely 6 lines).

**Files added (3):**

- **[`packages/ui-web/src/lesson/LessonSources/LessonSources.tsx`](../packages/ui-web/src/lesson/LessonSources/LessonSources.tsx)**
  — pure presentation. Props: `{ sources: readonly Source[] }`. Renders
  `<section>` → `<h2 className="reader-h2">Izvori</h2>` → `<ol>` with one
  `<li>` per source. Per-kind formatting per D4.

- **[`packages/ui-web/src/lesson/LessonSources/LessonSources.module.css`](../packages/ui-web/src/lesson/LessonSources/LessonSources.module.css)**
  — minimal: the `<ol>` gets serif body type, the `<a>` inherits the
  editorial accent underline (existing `--accent-ink` link colour).

- **[`packages/ui-web/src/lesson/LessonSources/index.ts`](../packages/ui-web/src/lesson/LessonSources/index.ts)**
  — re-export.

**Files modified (2 more):**

- **[`packages/ui-web/src/lesson/LessonReader/LessonReader.tsx`](../packages/ui-web/src/lesson/LessonReader/LessonReader.tsx)**
  — between `<LessonBody />` and `<footer>`, conditionally mount:
  ```tsx
  {lesson.sources && lesson.sources.length > 0 ? (
    <LessonSources sources={lesson.sources} />
  ) : null}
  ```
  Placeholder-aware: placeholders have no body, so they cannot have
  sources; guard remains.

- **[`packages/ui-web/src/lesson/LessonBody/LessonBody.tsx`](../packages/ui-web/src/lesson/LessonBody/LessonBody.tsx)**
  — replace the `case 'image':` branch placeholder div with a real
  `<figure>` containing `next/image` + caption. `<Image>` requires
  intrinsic `width` and `height`; add `width` / `height` optional fields
  to the `image` block in `LessonBlock` (small additive schema change)
  OR adopt `fill` + a constrained wrapper. **Default: add `width` and
  `height` to the schema** — explicit dimensions are simpler, avoid
  layout shift, and the curation step has them anyway.

  This means a second small `types.ts` edit. Worth flagging because it
  expands "image-block changes" beyond the renderer.

**Generated file regen:**

- `pnpm gen-content` is re-run, refreshing
  `packages/content/src/courses/istorija-srbije-365/_generated.ts`. All
  365 lessons appear with `byline === undefined`, `lastReviewedAt ===
  undefined`, `sources === undefined`, `content` blocks unchanged. The
  diff to `_generated.ts` is roughly: the `Lesson` interface widens at
  the type level (re-emitted from the regenerator), but no per-lesson
  object literal changes.

**Verification gates (commit-a):**

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
- `pnpm validate-content` green (365 / 0 / 37 / 8 unchanged).
- Live audit: open any lesson. Visually identical to today — no byline,
  no `Izvori` block, no figures rendered (because no lesson has data
  yet). The image-block renderer change is exercised only when a lesson
  carries an image, which none do at this point in the commit.
- Playwright suite unchanged (no new assertions yet — commit-b adds the
  visible content that the test would assert against).

### Commit 7.10/12-b — Editorial content drop

**Files modified (≤14):**

- **6 seed lesson JSON files** under
  `content/courses/istorija-srbije-365/lessons/` (Days 1, 7, 31, 106,
  200, 305 — the IDs are `day-001.json` through `day-305.json` matching
  the existing pattern). Each gains `byline`, `lastReviewedAt`, and
  `sources` with 2–5 entries.

- **8 era-opener lesson JSON files** (the lessons whose `dayNumber`
  equals each era's first section's `startDay` — to be enumerated at
  implementation time from `eras.json` + `sections.json`). Each gains
  one image block in `content[]` at an editorially appropriate insertion
  point (typically after the first 2–3 paragraphs, before the first H2).
  Day 1 is both a seed and the Era I opener — its single JSON file gets
  both edits.

- **`apps/web/public/lessons/`** — new directory with 8 image files
  (`era-1-praistorija.webp`, etc. — naming convention finalised at
  curation). All public-domain or CC-BY/CC-BY-SA. WebP format, target
  ~1200px wide, ≤200KB each (Next/Image will serve responsive variants).

- **`apps/web/public/lessons/README.md`** — small attribution log: file
  → source URL → license → photographer/illustrator. Lives in the repo
  for the audit trail; not rendered.

- **Regenerated `_generated.ts`** — now carries 6 lessons with sources/
  byline/`lastReviewedAt` and 8 lessons with image blocks.

**Files added:** the 8 image assets + the README.

**Files NOT touched (paranoia):**

- Any other lesson JSON file.
- Any other UI component (CourseProgress, CourseCard, TopBar, etc.).
- `apps/web/app/page.tsx` and the Home anchor.
- `@learn365/core` storage / selectors.
- `eras.json` / `sections.json` / `course.json`.
- `tooling/`, `apps/api`, anything backend-related.

---

## 5. Verification (whole phase)

Per the 7.x cadence:

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green on the
  final state.
- `pnpm validate-content` green (`365 / 0 / 37 / 8` — counts unchanged).
- Existing Playwright smoke (10 tests × 5 profiles = 48 pass / 2 skips
  post-7.9) passes unchanged. New assertions (proposed):
  - Open `/kurs/istorija-srbije-365/lekcija/day-001` (a seed + an era
    opener). Assert visible: `Izvori` heading, at least one `<a>` inside
    the sources list, at least one `<figure>` with a non-empty
    `<figcaption>`, a byline line containing `NAPISAO:` or `POSLEDNJI
    PREGLED:` (exact register pending screenshot review).
  - Open `/kurs/.../lekcija/day-002` (an unauthored-for-trust lesson).
    Assert `Izvori` heading is NOT present and the page renders without
    layout regression.
  - Test count goes from 10 → 11; Playwright runs from 50 → 55.
- Screenshot pack regenerated locally via `pnpm screenshots`. Shots to
  review (mobile + desktop):
  - `mobile-lesson-day-001.png` — byline + last-reviewed line under
    title; figure renders inline; `Izvori` block at bottom.
  - `mobile-lesson-day-002.png` — visually identical to pre-phase.
  - `desktop-lesson-day-001.png` — same, wider layout. `<LessonSources>`
    sits inside the editorial column, not in the sidebar.
  - Cross-check the screenshot capture race documented in
    `[[project_screenshot_capture_race]]` — trust live build if a PNG
    looks unstyled.
- Live audit at `pnpm dev`:
  - Open Day 1. Byline + last-reviewed eyebrow under title, figure mid-
    article, `Izvori` block at bottom with 3–5 entries linked or unlinked.
  - Click an external source link — opens in new tab.
  - Resize to 360px. Figure scales correctly via `next/image` srcset;
    caption wraps under it; sources list remains readable.
  - Open Day 50 (no trust data). No `Izvori`, no byline line, no figure.
    Identical to current.
- A11y spot-check:
  - `<figure>` carries `<figcaption>` (programmatic association via the
    HTML element pair; no extra ARIA needed).
  - `<LessonSources>` `<a>`s have visible text (no icon-only links).
  - `<a target="_blank">` carries `rel="noopener noreferrer"`.
  - Reading-order check: the `Izvori` block falls after the body, before
    the completion button. Tab order matches visual order.
  - Screen-reader smoke (deferred — folded into the carry-forward
    deferral from Phase 5, this phase does not introduce new SR-only
    failures).
- Lighthouse spot-check on `/kurs/.../lekcija/day-001`: confirm the
  image addition doesn't drag mobile Perf below the v1-accepted 82–85
  floor. If a single ~150KB hero-style image regresses LCP, switch to
  `next/image priority={true}` for the first figure only.

---

## 6. Risks

- **Image curation as schedule risk.** The roadmap already flagged
  this. Curation per era opener is 8 decisions: source platform
  (Wikimedia Commons + national museums + RGB digital archives), license
  check, attribution text composition, dimension capture. Realistic
  effort: half a day for the 8 images if a curator is committed; longer
  if licensing chases are needed. Mitigation: D7's two-commit split
  lets the schema+UI ship without blocking on curation.

- **Schema-vs-content drift.** If the schema lands (commit-a) but
  commit-b is delayed, the codebase grows surface area that no lesson
  uses. Low risk — the unused fields are all-optional and the UI
  components are guarded behind their presence — but it does create
  "what was this for?" confusion if commit-b is delayed >2 weeks.
  Mitigation: don't open the PR for commit-a until commit-b is at
  least drafted.

- **Image hosting in `apps/web/public/`.** Vercel serves static assets
  from the build output, so this is fine for v1. If the corpus later
  grows to 60+ images (per the proportional scaling rejected in D5), the
  build artifact size could become a concern; moving to an external CDN
  is a Phase 8-era decision.

- **Source link rot.** Web sources go stale. Mitigation: prefer durable
  archives (Wikipedia revision-stable links via `oldid=`, national
  archive permalinks) over volatile blog posts. Editorial guidance, not
  enforced in code.

- **Byline copy register.** Serbian convention for "by / reviewed by"
  varies by publication. The screenshot-review pass should consult a
  native speaker on the exact register (`Napisao:` vs `Autor:`;
  `Pregledao:` vs `Lektorisao:` vs `Stručna redakcija:`). Decision
  deferred to screenshot review; the plan does not lock copy.

- **Caption-as-attribution discipline.** D5 puts attribution in the
  caption string, not a separate field. If curation drifts and some
  captions omit attribution, the v1 won't enforce it. Mitigation: the
  curation README under `apps/web/public/lessons/` is the single source
  of truth — captions must match it. A future schema iteration can
  promote attribution to a typed field if the discipline doesn't hold.

- **`next/image` + locally-served assets in the monorepo.** Standard
  pattern in Next.js 15 App Router, no special configuration needed —
  but worth confirming on the first commit-b push that the image renders
  on the Vercel preview, not just locally.

- **Generated-file diff churn.** Adding three optional fields to
  `Lesson` and one optional `width`/`height` to the `image` block widens
  the type emitted by `gen-content`. The per-lesson object literals in
  `_generated.ts` stay byte-identical for the 351 untouched lessons
  (since all new fields are optional). PR diff will look bigger than it
  is — call this out in the PR description.

- **Screenshot capture race.** Documented in
  `[[project_screenshot_capture_race]]`. Trust live build over PNGs
  that show unstyled TopBar/Footer.

---

## 7. How to proceed

1. **Owner reviews this plan** and confirms or amends D1–D7. The biggest
   decision is D1 (scope ceiling — seed-only vs broader content
   coverage). Everything else falls out.
2. **On green-light**, open `feat/phase-7-10-12-trust-and-figures` off
   `main`.
3. **Land commit 7.10/12-a** (schema + UI, no content). Run all gates.
4. **In parallel:** image curation for the 8 era openers + source
   compilation for the 6 seeds. This is the schedule-risky workstream;
   it may finish hours or days after commit-a is ready.
5. **Land commit 7.10/12-b** (content drop + asset commit + regen).
   Run all gates again, including Playwright on the new assertions.
6. **Push and open a draft PR** so Vercel preview generates a live URL.
7. **Owner previews on mobile + desktop**, day-001 (full surface) and
   day-002 (no-trust baseline). Approves or calls out copy / layout.
8. **On approval the PR merges**, `docs/PROJECT_STATE.md` gains a
   "Phase 7.10 + 7.12 — Lesson trust scaffolding + editorial figures:
   done" section, `HANDOFF.md` refreshes the next-step pointer to
   **Phase 7.11** (reading comfort — scroll progress + bookmark), and
   `docs/PHASE_7_10_7_12_PLAN.md` moves into `docs/archive/phases/`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- The progress storage shape or any `@learn365/core` selector.
- `HomeDailyAnchor`, `HomeCurrentLessonCard`, `HomeHeroCta`,
  `HomeEraTimeline`.
- The TopBar capsule.
- The course overview (Phase 7.9's canonical row stays the floor).
- The era accordion / section accordion / sidebar / drawer.
- The historical timeline component.
- The `keyPeople` / `keyPlaces` corpus fields (separate concern — see §2).
- `MarkAsCompletedButton`, `PreviousNextLessonNavigation`,
  `CompletedFooter`.
- The 351 non-seed, non-era-opener lessons.
- `apps/api`, backend, or any swap-seam adapter.
- The hero image under `apps/web/public/hero/`.
- Any content authoring workflow change beyond the existing JSON
  drop-in + `pnpm gen-content`.
