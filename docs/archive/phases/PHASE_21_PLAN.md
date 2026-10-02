# Phase 21 — The reader tells the truth

**Source:** `docs/PRODUCT_REVIEW_2026-10-01.md`, P1 items 5–6 and P2 item 11, one change set.
**Status:** implemented on `phase-21/reader-truth`. Archive this file under `docs/archive/phases/` once it ships.

## Decisions

### Resume rule (owner-approved)

> **Resume = the first unread lesson after the highest-numbered completed lesson. If nothing after it is unread, the earliest unread lesson. Day 1 when nothing is completed; `null` when everything is read.**

Opening a lesson no longer counts. `lastOpenedLessonId` is still stored and synced but no longer decides anything (the `findResumeLesson` parameter is gone). Examples: read 1–3 and opened 250 → Day 4; read 1–3 and 365 → Day 4; read only 231–235 → Day 236; read {1, 3} of 4 → Day 4.

One rule, one hook (`useResumeLesson`), used by: the Home hero CTA, the card, the daily anchor ("Tvoj N. dan"), the **Home era-rail marker** (it used to follow lastOpened; with everything read it now sits on the last lesson), the overview progress card, the **overview's tinted row and its auto-opened era and section** (it used to follow lastOpened), and the lesson footer after Day 365. The overview opens and tints nothing before the first completion or once everything is read. `findActiveLocation` and `lessonViewState` had no callers left (and `lessonViewState` encoded "completed beats active"), so both are removed.

### Progress tree

- `LessonNavItem` takes `active` and `completed` as two flags. An active row that is read keeps the tint and the accent bar, shows the filled check, and always says ", pročitano". On the tint, the day and meta stay `--ink-2` (the completed green would drop below 4.5:1).

### Completion copy (`completionMoment`, unit-tested)

- Day 1 → "Prvi dan je iza tebe." Any other day → "Dan N je iza tebe." (Day 1 read again later still says "Prvi dan".)
- Last lesson read, course not finished → "Poslednja lekcija kursa je iza tebe." The card then opens the resume lesson (`Nastavi · DAN 001`, meta "Do kraja kursa: još 364 lekcije"). Without a resume lesson it opens the course.
- 365 / 365, whichever lesson closes it → "Kurs je završen." + "Svih 365 dana je iza tebe." (Home's wording, gender-neutral), the count, and a quiet "Otvori kurs →" link. No card, no confetti.

### Reader polish

- `.body > p { margin: 0 }`: 24 px between paragraphs (was 60 px). H2 stays at 48 px above, 24 px below. Quotes and figures keep their own margins.
- `Označi kao pročitano` uses the primary pill's tokens (`--ink` / `--bg`): 48 px tall, 16 px text, full width ≤ 720 px. The done state keeps the accent-soft look at the same size. Behaviour and label are unchanged.
- The date shows once. Above 720 px the timeline divider prints it at its marker, so the eyebrow's date is visually hidden there but stays in the accessibility tree (the divider is `aria-hidden`). On phones the divider is a bare rule and the eyebrow shows the date. If the timeline falls back to the flourish, the eyebrow keeps the date.
- The completed footer is one left-aligned column: the button, the sentence, the card and the previous link share one left edge (the sentence was centred).

### Focus and ARIA

- After any lesson change under the persistent shell, focus moves to the new lesson's `h1` (`tabIndex={-1}`, no ring), falling back to `#lesson-reader`. This is skipped on the first load (a ref seeded with the first id also covers Strict Mode). It is also skipped when focus is inside the desktop outline: the reader is browsing it and it keeps its own focus.
- When the sign-in prompt unmounts with focus lost (`Ne sada`), focus goes to the completed wrapper (`tabIndex={-1}`, no ring).
- `Otvori sadržaj` has `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls="lesson-contents-drawer"` (the id is on the dialog panel; axe allows a dangling `aria-controls` while `aria-expanded="false"`).
- Bookmark: the visible word is always "Sačuvaj" and the name is always "Sačuvaj lekciju". `aria-pressed` plus the filled ribbon carry the state. The old pair (visible "Sačuvano" / name "Ukloni iz sačuvanih") is gone.
- Section counters (outline and overview): "4 / 9" is `aria-hidden`; screen readers hear "4 od 9 pročitano".
- Home era rail: the name starts with the horizontal rail's visible text, then the full title: "I Praistorija i antika, 9500 p.n.e. Epoha I: …, praistorija – 9. vek". That contains the visible text of the vertical rows and of the numeral-only fallback.
- Overview era cards: `aria-labelledby` now lists every visible part in order (numeral, title, years, description, hint), so the name contains the visible label. It is longer, but it is what the card shows.
- Drawer open → the outline, the skip link and the reader column get the `inert` prop, so it is gone before the drawer hands focus back. Every sibling on the way up to `<body>` (TopBar, footer) is marked in an effect and restored on close.

## Files

- core: `navigation/index.ts`, `navigation.test.ts`
- ui-web: `LessonNavItem` (tsx, css, index), `course/index.ts`, `SectionAccordion.tsx`, `CourseCard.tsx`, `HistoricalTimeline.tsx`, `CompletedFooter` (tsx, css, new `completionMoment.ts` + test), `LessonFooter` (tsx, css), `MarkAsCompletedButton.module.css`, `LessonBody.module.css`, `LessonHeader` (tsx, css), `LessonBookmarkButton.tsx`, `MobileLessonDrawer.tsx`
- web: `useResumeLesson.ts`, `CourseOverviewEras.tsx`, `HomeEraTimeline.tsx`, `LessonShell.tsx`, `LessonContextHeader.tsx`, `LessonCompletion.tsx`
- e2e: `resume.spec.ts` (rule test: read 1–3 + opened 250 → "Tvoj 4. dan" and tinted overview row; active + read row), `reader.spec.ts` (focus on the h1 after the next card), `course.spec.ts` (bookmark name + `aria-pressed`)

## Gates

`pnpm typecheck`, `pnpm lint`, `pnpm test` (core 66, ui 7, content 37, ui-web 50, web 140). CI runs Playwright + axe. `next build` is not run on the laptop (OneDrive).
