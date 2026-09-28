# Phase 11 — Honest reading time: derived from the text, promised as a range (PLAN)

**Status:** Owner-authorized (standing authorization of 2026-09-28 to plan, build and merge the engineering backlog on green CI); built on `feat/phase-11-honest-reading-time`.
**Date:** 2026-09-28
**Predecessors:** Phase 10 live (PR #42, `eb7cc97`); Phase 9 live (PR #40, `6a0a533`).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P1 item 10, "Honest reading time (S)": _median lesson is 843 words (≈ 5 min at 170 wpm) yet 352 lessons declare 7–8 min; correlation between words and declared minutes is 0.26. Derive `readingTimeMinutes = ceil(words / 160)` in the validator, and change the promise from "~8 minuta" to "5–7 minuta" on Home, `course.json` and About._ Also "Commercial readiness 5/10: reading time overstated by ~60 %".
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: review P1 item 10 — honest reading time".
- [`CONTENT_CONTRACT.md`](../CONTENT_CONTRACT.md), [`docs/CONTENT_MODEL.md`](./CONTENT_MODEL.md), [`docs/CONTENT_AUTHORING.md`](./CONTENT_AUTHORING.md) — the JSON contract this phase changes in one field.
- [`docs/archive/phases/PHASE_10_PLAN.md`](./archive/phases/PHASE_10_PLAN.md) — structure template.

## Why this is the next phase

Measured on the 365 lesson files on 2026-09-28 (whitespace tokens carrying a letter or digit, in paragraph / heading / quote blocks):

| What | Today | After this phase |
| --- | --- | --- |
| Words per lesson | min 622 (Day 7) · median 832 · max 1026 (Day 247) | unchanged (no text edit) |
| Declared `readingTimeMinutes` | 6 ×12 · 7 ×219 · 8 ×133 · 9 ×1 — hand-written, correlation with the word count **0.26** | derived: `max(1, ceil(words / 150))` → **5–7**, median 6, correlation 1.0 by construction |
| Lessons whose declared minutes match the derived value | 8 of 365 | 365 of 365 |
| The promise in copy | `~8 minuta` (Home hero), "oko osam minuta čitanja" (how-it-works step, Home + About), "dovoljno osam minuta dnevno" (About mission), `estimatedMinutesPerLesson: 8` (`course.json`, unused by any surface) | one range computed from the data, `5–7 minuta`, in all three copy sites; the course-level number derived (median) |
| Who keeps it honest | nobody — a text edit never touches the number | the loader: the number cannot disagree with the text, and the copy cannot disagree with the numbers |

Overstating the time by ~60 % is the cheapest trust leak in the review to close, and it is a data-shape fix, not a content fix: no lesson text changes, no surface changes shape, the eyebrow simply shows `6 min čitanja` instead of `8 min čitanja`.

---

## 1. Locked decisions

### D1 — Reading time is derived from the text, never authored

`packages/content/src/loader/readingTime.ts`: `countWords(blocks)` counts whitespace-separated tokens that carry at least one letter or digit (a lone em dash or quotation mark is not a word) across `paragraph`, `heading` and `quote` blocks; image `alt` / `caption` are not counted (a glance, not reading). `estimateReadingMinutes(blocks) = max(1, ceil(words / WORDS_PER_MINUTE))` with `WORDS_PER_MINUTE = 150`. The loader assigns `readingTimeMinutes` from it; the field is **removed from the 365 JSON files** and the loader **rejects** it when present (`ContentLoadError`: "derived from the text — remove it"), so a stale copy cannot silently claim a number.

**Why 150 wpm and not the review's 160.** At 160 one lesson (Day 7, 622 words → 3.9) rounds up to 4 and the honest label becomes "4–7 minuta"; at 150 every lesson lands in 5–7 with headroom (a lesson would need fewer than 600 words to read "4", below the 700–1100-word authoring guideline). 150 is inside the attentive-reading band for Serbian prose (200+ wpm is skimming) and is the pace the guideline itself now states.

### D2 — The course-level number is derived too

`course.estimatedMinutesPerLesson` is read by no surface (grep: loader, type and docs only). It becomes the **median** of the lessons' derived minutes (6 today), computed by the loader; `course.json` drops the field and the loader rejects it when present. The `Course` type keeps the field so the contract's shape is stable.

### D3 — The promise is a range computed from the data

`@learn365/content` gains `getReadingTimeRange(courseId): { min, max } | null` over the authored (non-placeholder) lessons of the index. `apps/web/lib/copy/readingTime.ts` formats it once for the default course: `5–7 minuta` (or `6 minuta` when min = max, `1 minut` for one). The three copy sites interpolate that label instead of a literal:

- Home hero contract line → `365 lekcija · 1 dnevno · 5–7 minuta`
- how-it-works step 1 (Home first visit + About) → `Svaki dan te čeka jedna kratka lekcija, 5–7 minuta čitanja.`
- About mission → `… dovoljno 5–7 minuta dnevno tokom godinu dana …`

Digits with an en dash in all three (the hero already used digits); the label can never drift from the corpus again.

### D4 — Validator: the band applies to authored lessons; stats print the range

The `[4..15]` check stays but skips placeholders (their stub body derives to 1 minute). The success line prints `reading time 5–7 min (median 6)` next to the counts, so the honesty claim is visible on every CI run. Codegen is unchanged: `readingTimeMinutes` stays on the `LessonSummary` side (the index is not larger — the field was already there).

### D5 — Docs follow the contract

`CONTENT_CONTRACT.md` (course and lesson tables, placeholder rules, invariant 13, the checklist), `docs/CONTENT_MODEL.md`, `docs/CONTENT_AUTHORING.md` (guideline: "5–7 minutes ≈ 700–1100 words at 150 wpm"; the validator list), `docs/APP_ARCHITECTURE.md` §7 (one comment), `docs/PROJECT_STATE.md` (baseline: hero caption, loading approach), `HANDOFF.md`.

### D6 — One PR, three commits

- **11a — Content.** `readingTime.ts` + tests; loader derives and rejects; validator band + stats; `getReadingTimeRange` + tests; 365 lesson files and `course.json` stripped of the two fields (one script, one line each); `pnpm gen-content`.
- **11b — Copy.** `apps/web/lib/copy/readingTime.ts` + unit test; the three sites.
- **11c — Docs.**

---

## 2. Scope reframe

A data-shape phase: the number now comes from the text. No lesson text, no component, no CSS, no display format (`N min čitanja`) changes. Not in scope: the sources / trust scaffolding (item 9), the per-lesson word-count guideline as a validator rule, reading time on the course card, the `keyPeople` / `summary` fields (item 26).

## 3. Owner actions

None.

---

## 4. File-level bundle

### 11a — Content
- `packages/content/src/loader/readingTime.ts` (new) + `readingTime.test.ts` (new).
- `packages/content/src/loader/loadCourseFromFiles.ts` — `parseLesson`: `readingTimeMinutes` from `estimateReadingMinutes(content)`, reject the JSON field; `parseCourse` returns the record without the number, `loadCourseFromFiles` adds the median; reject `estimatedMinutesPerLesson` in `course.json`.
- `packages/content/src/loader/validateContentFiles.ts` — band check for authored lessons only; stats carry `readingTime: { min, max, median }`; success line prints them.
- `packages/content/src/registry.ts` + `src/index.ts` — `getReadingTimeRange`. `src/registry.test.ts` — range is consistent with `getLessons` and inside `[4..15]`; `course.estimatedMinutesPerLesson` equals the median of the index.
- `packages/content/src/types.ts` — doc comments on the two fields ("derived").
- `content/courses/istorija-srbije-365/lessons/day-*.json` (365 files, one line removed each), `content/courses/istorija-srbije-365/course.json` (one line removed).
- `packages/content/src/courses/istorija-srbije-365/_generated.ts` — regenerated (365 summary values + the course record).

Gate: `pnpm --filter @learn365/content test` (new tests + registry), `pnpm validate-content` prints the range, `pnpm gen-content` idempotent, `pnpm typecheck`, `pnpm lint`, the drift check clean.

### 11b — Copy
- `apps/web/lib/copy/readingTime.ts` (new) + `readingTime.test.ts` (new, formatting).
- `apps/web/app/page.tsx` (hero contract line), `apps/web/lib/copy/howItWorks.ts` (step 1), `apps/web/app/o-aplikaciji/_copy.ts` (mission body).

Gate: `pnpm build` + `check-bundle` (no route grows: the index already carried the field; `HomeHowItWorks` already sits in a graph that imports the index), `pnpm --filter @learn365/web test`, Playwright in CI (no spec asserts a minute string). Manual on `next start`: Home hero, the first-visit block, About, Day 1 / Day 7 / Day 247 eyebrows read 5–7.

### 11c — Docs
As in D5, plus the "Phase 11 — done" entry, the plan moved to `docs/archive/phases/`, the HANDOFF pointer to review item 11.

---

## 5. Verification (whole phase)

- All gates green locally and on the PR (both CI jobs); the gated deploy green; production: hero line reads `5–7 minuta`, a lesson eyebrow reads `6 min čitanja`.
- `pnpm validate-content` output quoted in the PR: `365 lessons … reading time 5–7 min (median 6)`.
- The stripped JSON: `git diff --stat` shows 366 files, exactly one deletion each (plus the comma fix on `course.json`).

## 6. Risks

- **Tokenization.** Counting by whitespace with a letter/digit filter is simple and stable; a different tokenizer would move counts by ±2 %, nowhere near a minute boundary for most lessons. The one lesson near a boundary (Day 7, 622 words) is 4.15 → 5 at 150 wpm.
- **Prose with digits on About.** "dovoljno 5–7 minuta dnevno" is acceptable editorial Serbian; the alternative (words) cannot be derived. Owner may reword later; the label itself stays derived.
- **A future long lesson.** 1,100+ words → 8 minutes → the label becomes "5–8 minuta" automatically. That is the point.
- **`/privatnost` imports `_copy.ts`** (for the contact address), which now imports the content index on the server — no client cost, ≈ 0 ms.

## 7. How to proceed

Branch, 11a → 11b → 11c, PR with the validator line and the before/after table, merge on green CI, watch the gated deploy, close out (PROJECT_STATE entry, archive, HANDOFF → item 11).

## 8. Out-of-scope reminders

No lesson text edits; no change to how minutes are displayed; no word-count invariant in the validator; no change to sources, bylines or `lastReviewedAt`.
