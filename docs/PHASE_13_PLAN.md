# Phase 13 — Era rail: stop truncating (PLAN)

**Status:** Owner-authorized (standing authorization of 2026-09-28 to plan, build and merge the engineering backlog on green CI); built on `feat/phase-13-era-rail`.
**Date:** 2026-09-28
**Predecessors:** Phase 12 code live (PR #46, `3a315c8`); Phase 11 live (PR #44, `fc72b29`).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P1 item 12, "Era rail: stop truncating (S)": _`HistoricalTimeline.module.css:118-126` uses `nowrap` + ellipsis on bands sized by lesson count, so "Kraj 20. veka i savremena Srbija" gets ~58 px on Home at 1440 and the lesson-page rail shows "Praistorij…". `eras.json` already carries `eraShort` (all ≤ 22 chars) — use it on the rail with the full title as tooltip; on the lesson page move the existing `compact` vertical variant into the sidebar/drawer (it is referenced in three comments and rendered nowhere) and drop the post-footer strip._
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: review P1 item 12".
- `packages/ui-web/src/lesson/HistoricalTimeline/` — the component, its stylesheet and `timelineMath.ts`.

## Why this is the next phase

Measured on the current build on 2026-09-28 (Playwright, Chromium, `getBoundingClientRect` on every band and its title):

| Surface | Bands | Title boxes | Clipped titles |
| --- | --- | --- | --- |
| Home rail @1440 (`home` variant, 14 px) | 90–215 px | 57–182 px | **7 of 8** (only "Nemanjićka Srbija" fits) |
| Home rail @1280 | 79–189 px | 46–156 px | 7 of 8 |
| Home rail @1100 | 66–159 px | 33–126 px | 7 of 8 |
| Lesson strip @1440 / 1280 / 1100 (`full` variant, 13 px, after the article) | 64–96 px (the 64 px floor dominates) | 39–71 px | **8 of 8** |

The bands are proportional to lesson counts (25–60 per era) and the full titles are 17–46 characters, so the rail was never going to fit them: the ellipsis was the design's answer, and it reads as broken ("Praistorij…"). `eraShort` (9–22 characters) fits most Home bands on two lines but not the narrowest one (era VIII, 25 lessons: 57 px of text at 1440 — "Savremena" alone is ~62 px), and nothing fits the lesson strip's 39–71 px boxes.

---

## 1. Locked decisions

### D1 — Desktop bands show `eraShort`; mobile rows and the compact variant keep the full title

The band renders both `<span class="title titleShort">{eraShort}</span>` and `<span class="title titleFull">{title}</span>`; CSS shows one: the short label on the desktop rail (`full` and `home` variants ≥ 721 px), the full title in the vertical mobile rows (≤ 720 px) and in the `compact` variant, where there is room for it. The band gets `title` = full title + years (`Nemanjićka Srbija (1166–1371.)`) — the tooltip the review asks for. No `aria-label`: assistive technology reads the visible label (short or full), the numeral and the year, plus the `title` as a description.

### D2 — Labels wrap to two lines instead of clipping

Desktop `.title`: `white-space: normal`, a two-line clamp (`-webkit-line-clamp: 2`), `overflow-wrap: normal` — a label either fits on two lines or is not shown at all (D4); it is never cut mid-word again.

### D3 — A floor on band weight, honoured by the marker and the fill

`flooredWeights(lessonCounts, MIN_BAND_SHARE = 0.09)` in `timelineMath.ts` raises any era below 9 % of the course to that share (today only era VIII: 25 → 32.85 lesson-equivalents; era V at 35 = 9.6 % is untouched). The same weights drive the CSS `--weight`, `markerPositionPercent` and a weight-aware `timelineFillPercent`, so the marker and the completed fill stay exactly on the band boundaries. The old `min-width: 64px` on `.bandItem` goes — a pixel floor the maths could not see is what pushed the lesson strip's marker off its band today. Why 9 %: the smallest share at which "Savremena Srbija" fits on two lines at 14 px on a 1440 px Home rail (band ≈ 116 px → text ≈ 83 px; measured, not estimated).

### D4 — When a label cannot fit, the band keeps the numeral and the year; the lesson strip is numerals only

`.text` becomes a size container (with `flex: 1`, or it would collapse to zero width); `@container` rules hide `.titleShort` when the text box is narrower than the longest single word of any short label at that font size (measured in Chromium, not estimated), and `.yearShort` when even "9500 p.n.e." cannot sit on one line. The lesson page's strip (`full` variant, a ~700 px column with 27–75 px text boxes) would show two labels and hide six — a mixed look — so it shows **numerals only**: "I · II · III … VIII" with the year-interpolated marker and the current numeral in accent, a slim position indicator; the era name and years are one hover away (tooltip) and in the sidebar rows next to it (`EPOHA I Praistorija i antika`). On Home every label fits at 1440 (era VIII thanks to D3); at 1280 era V and VIII show numeral + year, at 1100 the year alone on the narrowest.

### D5 — The strip stays; the compact-rail-in-the-sidebar idea is an owner decision

The review's second suggestion (drop the post-footer strip, render the `compact` vertical variant inside the sidebar / drawer) changes the reader's layout, which the owner declared a floor on 2026-05-19 and re-tuned on 2026-09-25 ("era strip after the article on desktop"). Out of scope here; recorded in HANDOFF as a small follow-up with a recommendation (do it: the strip carries little the sidebar does not, and the drawer already has room for the compact rail).

### D6 — One PR, two commits

- **13a — Rail.** `timelineMath.ts` (+ tests), `HistoricalTimeline.tsx`, `HistoricalTimeline.module.css`. (`ui-web` has no DOM test setup; the rendering is verified by the measurement spec and the screenshots.)
- **13b — Docs + screenshots.** PROJECT_STATE baseline (Home + lesson reader bullets), HANDOFF; the screenshot pack regenerated and eyeballed at 1440 / 390 (Home, lesson).

---

## 2. Scope reframe

A component-only phase inside `@learn365/ui-web`: no content, no route, no data change (`eraShort` is already in `eras.json` and on the `Era` type). Not in scope: the `Pod tuđom vlašću` wording (review item 25), moving the rail into the sidebar (D5), the mobile `LessonTimeline` ticks (item 16), `--faint` contrast (item 15).

## 3. Owner actions

None. Decision to take when convenient: D5.

---

## 4. File-level bundle

- `packages/ui-web/src/lesson/HistoricalTimeline/timelineMath.ts` — `MIN_BAND_SHARE`, `flooredWeights`, `timelineFillPercent(stats, weights?)`. `timelineMath.test.ts` — floor (no-op above the share, raises below, sums consistent), weighted fill equals the old formula when weights are the lesson counts.
- `packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.tsx` — floored weights for CSS, marker and fill; two title spans; `title` attribute on the band.
- `packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.module.css` — D1 / D2 / D4 rules; `min-width: 64px` removed.
- `docs/PROJECT_STATE.md`, `HANDOFF.md`; `screenshots/` regenerated locally (git-ignored).

Gate: `pnpm --filter @learn365/ui-web test` + typecheck + lint; `pnpm build`; the measurement spec re-run (no clipped title anywhere at 1440 / 1280 / 1100; the marker inside the current band); Playwright suite in CI; screenshots read.

## 5. Verification

- Measurement spec (temporary, not committed) after the change: `clipped=false` for every visible title on both surfaces at the three widths; hidden labels only where the container is below the threshold.
- Marker: on `/course/istorija-srbije-365/lesson/day-341` (first lesson of era VIII) the marker's x lies inside era VIII's band; on `day-340` inside era VII's.
- Screenshots: Home desktop + mobile, lesson desktop + drawer; no visual regression beyond the labels.
- CI green; gated deploy; production Home HTML contains `Praistorija i antika` inside the rail.

## 6. Risks

- **Container queries** need Chromium 105+, Firefox 110+, Safari 16+ (2022–23). Older browsers ignore the query and show the label — the pre-Phase-13 clipping, never worse.
- **`-webkit-line-clamp`** is universally supported in practice; the fallback is `overflow: hidden` on two lines of text.
- **Weight floor** shifts the other seven bands by ≈ 1.6 % in total — invisible, and exact for the marker by construction.
- **Home at 1280 / 1100 px** shows numeral + year on the narrowest one or two bands; the label returns as the viewport widens (mobile rows take over at 720).

## 7. How to proceed

Branch, 13a → 13b, PR, merge on green, gated deploy, close out (PROJECT_STATE entry, archive, HANDOFF → P2 bundle).

## 8. Out-of-scope reminders

No change to the sidebar, the drawer, `LessonTimeline`, the era cards, the `eras.json` labels or any copy.
