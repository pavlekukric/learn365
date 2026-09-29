# Phase 15 — The reader frame: persistent shell, desktop frame, mobile stack (PLAN)

**Status:** Built, in PR — under the standing authorization of 2026-09-28 (plan, build, PR, squash-merge on green CI). Outcome and measurements: `docs/PROJECT_STATE.md` → "Phase 15".
**Date:** 2026-09-29
**Predecessors:** Phase 14 live (PR #51, `3de5168`); Phase 13 live (PR #48, `85ebe41`).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P2 items **16** (mobile reader stack) and **17** (desktop reader frame), plus the one part of item **21** Phase 14 left for here ("keep the article a server component and island only the completion footer").
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: Phase 15 — the reader frame".
- Phase 13 decision D5 (the era rail inside the drawer).

## Why one phase

Both items change the same file (`LessonPageClient`) in the same way: what belongs to the *course* (outline, drawer, sticky header) has to stop being rebuilt for every *lesson*. Once the shell is a layout, the desktop frame and the mobile stack are small CSS and placement changes on top of it.

## Two behaviour changes the owner should know about

1. **The sign-in ask moves and quiets down (D7).** Today it sits between the completion moment and the next-lesson card, under every completed lesson, until `Ne sada` is pressed. After this phase it sits **below** the next-lesson card and the previous-lesson link, and appears on **one lesson per browser session**. The rule for *when* it becomes due (second completed lesson, accounts on, signed out, not dismissed) does not change.
2. **The outline stays where the reader left it (D1).** Previous / next no longer resets the sidebar: eras and sections opened by hand stay open and the list keeps its scroll position; the row of the open lesson is brought into view when it is outside it.

Neither changes a route, stored data or the API.

---

## 1. Measured before (Chromium, production build of `main`, 2026-09-29)

| What | Value |
| --- | --- |
| Desktop 1920: TopBar content box | 280 – 1640 px (brand at 280) |
| Desktop 1920: sidebar / article | sidebar 0 – 320, article 360 – 1020 (flush to the left edge of a 1920 px window) |
| Gutter sidebar → article | 40 px at every width |
| Prev / next at 1440 (one extra era opened, outline scrolled to 180 px) | after the navigation: outline scroll 0, the extra era closed |
| Mobile 390: sticky context header | 51 px, reads `Dan 003 / 365` next to `Pročitano 2 / 365` |
| Mobile 390: header divider | 31 px + margins, its only text repeats the eyebrow's date |
| Mobile 390: first paragraph | starts at 546 px |
| Drawer | no era rail (the `compact` variant is rendered nowhere) |

## 2. Locked decisions

### D1 — A persistent lesson shell

- New `app/course/[courseId]/lesson/layout.tsx` (server) renders `LessonShell` (client) around `{children}`. The shell owns what belongs to the course: the sticky desktop `CourseSidebar`, the `MobileLessonDrawer`, the `LessonContextHeader`, `ReadingProgress`, the open-era / open-section sets, the drawer state and `markOpened`.
- The shell learns the open lesson from `useParams()` and the navigation index (`@learn365/content`, client-safe since Phase 9). Pages stay prerendered: `useParams` does not make a route dynamic.
- A layout survives navigation between its pages, so sidebar scroll and expansions survive prev / next. Leaving the lesson route (Home, course overview) drops them, as today.
- The current era and section are opened when the lesson changes by adjusting state during render (React's documented pattern), not in an effect — the row exists in the same commit that makes it current, which D4 depends on. The reader can still collapse them by hand.
- The drawer closes when the lesson changes (it used to close by being unmounted).
- An id the index does not know renders `{children}` alone (the router's 404 owns that case).
- `LessonPageClient` is deleted.

### D2 — The article is a server component; three islands remain

- `LessonReader` (`@learn365/ui-web`) loses `'use client'` and every callback: it becomes the reader's frame — breadcrumbs, header, article, footer slot, era-strip slot — rendered by the server page.
- `LessonHeader` takes the bookmark control as a node (`bookmark`), not as callbacks.
- Client islands, each a thin store wrapper in `apps/web` around a stateless `ui-web` component:
  - `LessonBookmarkToggle` → `LessonBookmarkButton` (new, the button that lived inside `LessonHeader`);
  - `LessonCompletion` → `LessonFooter` (new: `MarkAsCompletedButton`, `PreviousNextLessonNavigation` / `CompletedFooter`, the scroll-into-view on the completion edge, the sign-in ask);
  - `LessonEraStrip` → `HistoricalTimeline` with per-era stats from the progress store.
- Breadcrumbs, eyebrow, title, lede, the header divider and the whole article are no longer hydrated. Same HTML, same pixels.

### D3 — Desktop frame

- `.layout` is capped at `--shell-max` (1440 px) and centred: from 1440 px up the outline and the article share the TopBar's box instead of hugging the window's left edge. Below 1440 px nothing moves.
- Where the frame is narrower than the window the sidebar gets a left hairline, so the column reads as a panel and not as a list floating in the margin.
- Gutter sidebar → article: `clamp(40px, 5vw, 80px)` — 64 px at 1280, 72 px at 1440, 80 px from 1600; it stays near today's 40 px on small laptops (1025 – 1100 px), where a wider gutter would squeeze the 660 px measure. The article stays left-anchored; the right padding stays 40 px.

### D4 — The open lesson's row is in view on desktop

- `CourseSidebar` gains `revealCurrent`: on mount and whenever the current lesson changes, if the row is outside the visible part of the list, the **list** is scrolled so the row is centred — never the page (`scrollTop` on the list, no `scrollIntoView`). Instant on mount, smooth after a navigation, instant under reduced motion.
- Only the desktop instance asks for it. The drawer keeps its own scroll-on-open.

### D5 — Mobile: one day counter, no duplicated date

- `LessonContextHeader` reads `Dan 003` — the denominator stays where it means something, in `Pročitano 2 / 365` beside it.
- ≤ 720 px the header divider (`LessonTimeline`) keeps its hairline and drops the pin and the label: the label repeated the eyebrow's date 100 px above it, and a pin without a scale says nothing. Desktop and tablet keep the full divider with its tick row.

### D6 — The era rail opens the drawer (Phase 13 D5, the drawer half)

- The drawer renders `HistoricalTimeline` `variant="compact"` above the outline, under a `Vremenska osa` eyebrow, inside the same scroll (the outline's own eyebrow reads `Sadržaj`). It is the only era timeline a phone has on the lesson page.
- `CourseSidebar` gains a `lead` slot rendered at the top of its scrolling list, outside the `nav` landmark, so the two navigations are siblings and not nested.
- The drawer still opens centred on the current lesson; the rail is the first thing in the list for a reader in the first era and one scroll away for everyone else.
- **Not decided here (stays with the owner):** the desktop half of D5 — dropping the post-article strip. The strip stays.

### D7 — The sign-in ask: after the navigation, once per session

- Order under a completed lesson: the moment → the next-lesson card → the previous-lesson link → the ask. `CompletedFooter` loses its `afterMoment` slot.
- The ask is not part of the scroll target on completion: the moment and the next card are what the reader is brought to.
- Once per session: the first lesson the ask is shown on is remembered in `sessionStorage` (`learn365:signin-prompt:session:v1`); it stays on that lesson (a reload does not make it vanish) and is not shown on any other lesson until the browser session ends. `Ne sada` still dismisses it for good (`localStorage`, unchanged).
- The rule is a pure function (`signInAskDecision`) with unit tests; accounts are off in Playwright, so the browser suite cannot see the card.

### D8 — One PR, four commits

- **15a — Shell + islands** (D1, D2): no visual change intended.
- **15b — Desktop frame** (D3, D4).
- **15c — Mobile stack** (D5, D6, D7).
- **15d — Tests + docs**: e2e for persistence, reveal, the frame, the mobile header and the drawer rail; PROJECT_STATE, HANDOFF, COMPONENT_LIBRARY, APP_ARCHITECTURE.

## 3. Gates

`pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm --filter @learn365/web check-bundle`; Playwright Chromium desktop + mobile locally and in CI; the measurements of §1 repeated on the new build and recorded in PROJECT_STATE; screenshots at 390, 1280, 1440 and 1920 read before the PR. After the rollout: `/api/health`, a lesson page `200` + `x-nextjs-cache: HIT`, the prerender count unchanged (373 routes).

## 4. Out of scope

Dropping the desktop era strip (owner, Phase 13 D5), brand / About tone (item 19), self-hosted fonts, the P3 editorial items, any change to routes, stored data or the API.
