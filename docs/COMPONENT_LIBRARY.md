# Component Library

Each shared component used by the web app, with its prop contract, visual states, accessibility notes, and mobile-equivalent considerations. Implementations live in `packages/ui-web` (web) and, eventually, `packages/ui-mobile` (mobile). Tokens come from `packages/ui`.

Components are **stateless with respect to user data**. They never read a store, a selector or the content registry — the app composes data and passes props in. Two imports are allowed and used:

- **Types** from `@learn365/content` (`Era`, `Section`, `LessonSummary`, `LessonHeading`, `LessonBlock`, `Source`, `LessonByline`) for prop shapes — never a runtime import.
- **The pure day formatters** from `@learn365/core` (`formatDayEyebrow`, `formatDayRange`, `formatDayProse`, `padDay`), so every surface spells a day the same way. Used by `CompletedFooter` (+ `completionMoment`), `CourseProgress`, `CurrentLessonCard`, `LessonNavItem`, `PreviousNextLessonNavigation`, `SectionAccordion`. Nothing stateful from `core`.

In-app links are `next/link` anchors (a plain `<a>` for `/api/**` and external sources); every href is built by the app (`apps/web/lib/routes.ts`) and passed in.

---

## Conventions

- Every interactive element accepts an optional `aria-label`.
- Every clickable non-`<button>` element uses `role="button"` and has `tabIndex={0}` + keyboard handlers, or is upgraded to a real `<button>`.
- Focus-visible state is a 2-px `var(--accent)` outline with 2-px offset.
- Disabled state: opacity 0.4, `cursor: not-allowed`, no hover effects.

---

## 1. Primitives

### `Brand`

```ts
type BrandProps = { className?: string };
```

Visual-only mark. Stateless — the host (e.g. `TopBar`) is responsible for wrapping it in the appropriate `next/link`. Renders the "I" mark + `Istorija 365` wordmark (the brand was "History 365" until 2026-09-30).
A11y: accessible name comes from the host link, not from `Brand` itself.
Mobile: identical, sized down via CSS.

### `TopBar`

```ts
type TopBarRoute = 'home' | 'course' | 'lesson' | 'about' | 'other'; // other: account, privacy, 404

type TopBarAccount =
  | { kind: 'loading' } // invisible placeholder, no layout shift
  | { kind: 'signed-out'; href: string } // quiet `Prijava` link (icon-only ≤ 720 px)
  | { kind: 'signed-in'; href: string; name: string | null; pictureUrl: string | null }; // AccountMark

type TopBarProps = {
  route: TopBarRoute;
  courseHref: string;
  aboutHref: string;
  totalLessons: number;
  completedCount: number;
  account?: TopBarAccount | null; // omitted / null when accounts are off
};
```

Sticky, translucent (`backdrop-filter: saturate(160%) blur(14px)`). Contains `Brand` (wrapped in a `next/link` to `/`), nav links (Početna, Kurs, O aplikaciji) as real `next/link` anchors driven by `courseHref` / `aboutHref`, and a tiny progress chip (`xxx / 365` + thin bar).
States per nav link: idle, hover, active (current route).
A11y: nav links use `aria-current="page"` when active. The `Kurs` link is also marked active when `route === 'lesson'`.
Mobile: nav links remain visible (no hamburger); progress chip moves into a sticky sub-bar inside the lesson reader.

**Navigation pattern note.** All top-level nav primitives (`TopBar` nav links, `Brand` link, `Breadcrumbs` non-terminal crumbs) use `href` rather than `onClick` so middle-click / right-click / open-in-new-tab work and the markup is real anchors. The Phase-3 `onClick → href` revision is complete across the app.

### `Breadcrumbs`

```ts
type BreadcrumbItem = {
  label: string;
  // When set, the crumb renders as a `next/link` anchor.
  href?: string;
  // Fallback for crumbs that need an in-page action rather than a route change.
  onClick?: MouseEventHandler<HTMLButtonElement>;
};
type BreadcrumbsProps = { items: BreadcrumbItem[] };
```

Render order: `href` → `<Link>`; `onClick` → `<button>`; neither → `<span>`.
The last item follows the same rule: with an `href` it is a link, without one a plain span
marked `aria-current="page"`. Separator is `/`.

Phase 6.8d completed the Phase-3 `onClick → href` revision for navigation —
breadcrumbs that go up a level use `href` so middle-click / right-click /
open-in-new-tab work and the crumb is a real anchor (not a styled span).

A11y: wrap in `<nav aria-label="Breadcrumbs">`; a crumb with an `href` is a link wherever it sits, and only a last crumb _without_ one gets `aria-current="page"` (the lesson page passes four ancestor links and no current crumb).
Mobile: shows only the last two crumbs.

### `Button`

```ts
type ButtonProps = {
  variant?: 'primary' | 'outline' | 'quiet';
  iconRight?: ReactNode;
  className?: string; // layout hook only (grid placement)
  children: ReactNode;
} & (
  | { href: string; plainAnchor?: boolean; 'aria-disabled'?: boolean } // next/link, or a plain <a> for /api/** hrefs
  | {
      type?: 'button' | 'submit' | 'reset';
      onClick?: MouseEventHandler;
      disabled?: boolean;
      'aria-pressed'?: boolean;
    }
);
```

The one pill (Phase 14): `primary` is the ink pill — one per surface (Home hero CTA, course start, 404, sign-in); `outline` its hollow twin (`Odjava`, the delete confirmation); `quiet` a text action (`Ne sada`, `Obriši nalog`). Surfaces carry no pill CSS of their own. The trailing icon translates 2 px right on hover.
A11y: a native `<button>` (type=button by default) or a real anchor; `aria-disabled` keeps an inert link in the tree.

### `ProgressBar`

```ts
type ProgressBarProps = {
  value: number;
  size?: 'thin' | 'regular' | 'thick';
  ariaLabel?: string;
  ariaValueText?: string;
};
```

`value` is 0..1. Animates width with `duration.medium`.
A11y: `role="progressbar"` with `aria-valuenow` (0..100) and the caller's `aria-valuetext` (e.g. `12 od 45`).

### `ProgressRing`

```ts
type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  children: ReactNode;
};
```

SVG ring; child content centered. Animates with `duration.medium`.
A11y: container has `role="img"` and `aria-label={label}` (default `42 % pročitano`; `CourseProgress` passes `Pročitano 12 od 365 lekcija`).

### `CompletionDot`

```ts
type CompletionDotProps = { state: 'idle' | 'active' | 'done' };
```

States visually:

- `idle` — empty circle, faint border
- `active` — accent border with a small accent center dot
- `done` — filled completion-color circle with white check

A11y: decorative when paired with a lesson title; given `aria-hidden="true"`. Lesson row owns the textual state announcement.

### `Eyebrow`

```ts
type EyebrowProps = { children: ReactNode };
```

Renders the eyebrow type class — uppercase, tracked, muted.

### `Flourish`

Decorative divider. Centered serif glyph (`✦`) with two hairlines. Hidden in Modern direction.

### Icons

`IconCheck`, `IconChev`, `IconArrow`, `IconArrowLeft`, `IconBookmark`, `IconMenu`, `IconClose`, `IconUser`.

```ts
type IconProps = React.SVGProps<SVGSVGElement>;
```

All use `stroke="currentColor"`, no fill.

### `AccountMark`

```ts
type AccountMarkProps = {
  name: string | null;
  pictureUrl: string | null; // requested with referrerPolicy="no-referrer"
  href: string; // the account page
  label?: string; // default `Nalog: <name>` / `Nalog`
};
```

The signed-in mark in the masthead: a 28 px circle with the reader's picture, else their initials (`initialsFor`, unit-tested), else a person glyph. A link to the account page, not a status display.

### `Footer`

```ts
type FooterProps = { aboutHref: string; sourcesHref: string; privacyHref?: string };
```

Site footer: brand link home, the tagline, `O aplikaciji · Izvori · Privatnost`, the copyright line. A11y: `role="contentinfo"`; the links sit in `<nav aria-label="Podaci o aplikaciji">`.

---

## 2. Course & lesson surfaces

### `CourseCard`

```ts
type CourseCardProps = {
  era: Era;
  totalLessons: number;
  completedLessons: number;
  isCurrent: boolean;
  isAllDone: boolean;
  href: string; // the action link: first unread lesson of the era (its first lesson once all are read)
  description?: string; // editorial paragraph
  isOpen: boolean; // disclosure of the era's section list below the card
  onToggle: () => void;
  panelId: string; // id of that section-list panel
  sectionCount: number;
};
```

The era block on the course overview. Two different things to do: the card body is a disclosure button (inside an `h3`, the WAI accordion pattern) that opens the era's sections — `Pokaži odeljke · N` / `Sakrij odeljke`; one labelled link on the right — `Počni` / `Nastavi` / `Pročitano ✓` — opens the right lesson. A thin `ProgressBar` with `n / total` sits beside it.
States: idle, hover, focus-visible, current, all-done, open.
A11y: the button's name is the card's visible text in reading order (`aria-labelledby` over number, title, years, description, hint — WCAG 2.5.3); the action link is named `<action>: <era title>`.

### `CourseProgress`

```ts
type CourseProgressProps = {
  completed: number;
  total: number;
  lesson: { day: number; title: string; readingTimeMinutes?: number } | null; // the resume lesson; null once all are read
  href: string | null;
  journeyDayLabel: string | null; // e.g. `Tvoj 4. dan`; null for a fresh reader
};
```

The progress card on the course overview. Fresh reader (`journeyDayLabel === null`): no ring, the lesson to open and one `Počni od Dana 1` pill. Started: a ring that counts lessons, not percent (`12` / `od 365`, so the first win never rounds to 0 %), and one `Nastavi` row to the resume lesson; `Sve lekcije su pročitane.` when done.

### `CourseSidebar`

```ts
type CourseSidebarProps = {
  eras: readonly Era[];
  sections: readonly Section[];
  lessons: readonly LessonSummary[];
  currentLessonId: LessonId | null;
  completedIds: ReadonlySet<LessonId>;
  openSectionIds: ReadonlySet<SectionId>;
  onToggleSection: (id: SectionId) => void;
  openEraIds: ReadonlySet<EraId>;
  onToggleEra: (id: EraId) => void;
  lessonHref: (lesson: LessonSummary) => string;
  revealCurrent?: boolean; // desktop: keep the current row in view (Phase 15)
  lead?: ReactNode; // drawer: the era rail, above the outline (Phase 15)
};
```

Composes `EraGroup` → `SectionAccordion` → `LessonNavItem`. Full-height list with a thin scrollbar; the caller makes it sticky. Rows are `next/link` anchors; the open sets live in the caller (the lesson shell), so the desktop sidebar and the drawer share them.
`revealCurrent`: on mount and whenever `currentLessonId` changes, a row outside the visible part of the list is centred in it — the list scrolls, never the page (`revealScrollTop`, unit-tested). `lead` renders at the top of the scrolling list, outside the `nav` landmark.
A11y: `<nav aria-label="Sadržaj kursa">`. Era and section heads are real `<button>`s with `aria-expanded`. The active lesson row carries `aria-current="page"`.

### `EraGroup`

```ts
type EraGroupProps = { era: Era; isOpen: boolean; onToggle: () => void; children: ReactNode };
```

The era-level accordion in the sidebar and drawer: `EPOHA II`, the short era label (`eraShort`, full title as tooltip), the years; its `SectionAccordion`s inside. Collapsed by default; the shell opens the current era. Same chevron row as `SectionAccordion`, so the two levels read as one hierarchy.
A11y: a `<button>` with `aria-expanded` / `aria-controls`.

### `SectionAccordion` _(formerly CourseSectionAccordion)_

```ts
type SectionAccordionProps = {
  section: Section;
  lessons: readonly LessonSummary[];
  currentLessonId: LessonId | null;
  completedIds: ReadonlySet<LessonId>;
  isOpen: boolean;
  onToggle: () => void;
  lessonHref: (lesson: LessonSummary) => string;
};
```

Header row: chevron, section title with sub-eyebrow (day range, `formatDayRange`), `done / total` counter (read to screen readers as `4 od 9 pročitano`).
States: collapsed, open, contains-current (subtle accent on the title).
When open, renders all its `LessonNavItem`s.
A11y: header is a `<button>` with `aria-expanded` and `aria-controls` pointing to the lesson list region id.

### `LessonNavItem`

```ts
type LessonNavItemProps = {
  lesson: LessonSummary;
  active: boolean; // "you are here": the open lesson, or the overview's resume row
  completed: boolean; // read — independent of `active` since Phase 21
  href: string;
  isCurrentPage?: boolean; // default true; false where the active row is not the page being viewed
};
```

Row: `CompletionDot`, day number (`padDay` → `012`), lesson title, reading time (left out on placeholder rows).
States visualized (the two flags combine):

- neither — muted text
- `active` — accent-tinted background + 2-px accent left bar
- `completed` — muted title color, completion-color day number, filled green dot; an active row that is also read keeps the tint and shows the check

A11y: `<a>` with `aria-current="page"` when `active && isCurrentPage`; a read row adds a visually hidden `, pročitano`; a placeholder row is named `<title> — uskoro dostupno`.

### `HistoricalTimeline`

```ts
type HistoricalTimelineProps = {
  eras: readonly Era[];
  currentLesson: { eraId: EraId; year: number };
  eraHref?: (eraId: EraId) => string; // bands become links
  eraStats?: ReadonlyMap<EraId, EraStat>; // { lessonCount, completedCount }
  variant?: 'full' | 'compact' | 'home';
};
```

The journey rail. With `eraStats`, bands are sized by lesson count (the smallest raised to a floor so its label fits — `flooredWeights`), with a progress fill; without, equal widths. The marker is interpolated by the lesson year inside the current era (`timelineMath`, unit-tested). Desktop bands show `eraShort` (full title + years as tooltip). ≤ 720 px the same data turns into a vertical rail, one row per era.
Variants: `home` (the Home centrepiece, heavier on desktop), `compact` (the vertical layout at any width — the top of the mobile drawer), `full` (no caller since the lesson-page strip was dropped).
States: era — completed, current, upcoming.
A11y: `<nav aria-label="Vremenska osa epoha">`; the rail is `aria-hidden`; the current band carries `aria-current="true"`.

### `LessonHeader`

```ts
type LessonHeaderProps = {
  lesson: LessonHeading;
  eraShort?: string; // eyebrow prefix on single-column layouts
  bookmark?: ReactNode; // <LessonBookmarkButton />, pinned top-right
};
```

Renders the eyebrow row (`[eraShort ·] n min čitanja · date`), title, subtitle and the `LessonTimeline` divider (≤ 720 px: a plain rule, since Phase 15). No state and no handlers — it renders on the server; the bookmark control arrives as a node.

### `LessonBookmarkButton`

```ts
type LessonBookmarkButtonProps = {
  isBookmarked: boolean;
  onToggle: () => void;
};
```

The save-for-later toggle (`Sačuvaj` / `Sačuvano`), a client component. Positions itself against `LessonHeader`'s top-right corner. A11y: `aria-pressed`, a label that names the action.

### `LessonBody`

```ts
type LessonBodyProps = {
  blocks: readonly LessonBlock[];
};
```

Renders structured `LessonBlock[]` content (an exhaustive switch). The first `paragraph` with `dropcap: true` gets dropcap treatment. Supports `paragraph`, `heading`, `quote`, `image`; `image` renders through `next/image` with its intrinsic `width` / `height`, capped at `min(80vh, 720px)` tall.
A11y: blockquote renders inside `<blockquote>` with `<cite>` for attribution. Images require non-empty `alt`.

### `LessonReader`

The reader's frame (Phase 15): `Breadcrumbs` + `LessonHeader` + the article + the footer. It has no state and no handlers, so the lesson page renders it on the server; what depends on the reader arrives as nodes. (The era strip after the footer was dropped in Phase 17; the era rail lives in the drawer.)

```ts
type LessonReaderProps = {
  lesson: LessonHeading;
  breadcrumbs: readonly BreadcrumbItem[];
  eraShort?: string;
  article: ReactNode; // LessonBody + LessonSources + LessonTrustLine
  bookmark?: ReactNode; // <LessonBookmarkButton />
  footer: ReactNode; // <LessonFooter />
};
```

### `LessonTimeline`

```ts
type LessonTimelineProps = { year: number; label?: string }; // label: usually the lesson's dateLabel
```

The divider under the lesson title: a hairline with a few round year ticks around the lesson and one accent marker (`lessonTimelineScale`, unit-tested). Falls back to `Flourish` when the year gives no sensible scale. A plain rule ≤ 720 px. A11y: decorative, `aria-hidden` — the header eyebrow already says the date.

### `LessonSources`

```ts
type LessonSourcesProps = { sources: readonly Source[] };
```

The closing `Izvori` section (`h2` + ordered list): `author (year) · title`, a link (new tab, `noopener`) when the source has a `url`. Renders nothing for an empty list.

### `LessonTrustLine`

```ts
type LessonTrustLineProps = { byline?: LessonByline; lastReviewedAt?: string }; // ISO YYYY-MM-DD
```

One mono line at the end of the article, after `Izvori`: `NAPISAO: … · PREGLEDAO: … · POSLEDNJI PREGLED: dd.mm.yyyy.` Renders nothing when the lesson carries neither field — there is no course-wide fallback.

### `LessonFooter`

```ts
type LessonFooterProps = {
  dayNumber: number;
  isUpcoming?: boolean;
  isCompleted: boolean;
  onToggleComplete: () => void;
  completedCount: number;
  totalLessons: number;
  prev: LessonFooterLink | null;
  next: LessonFooterLink | null;
  resume?: LessonFooterLink | null; // last lesson with others unread: where to continue
  courseHref: string;
  signInPrompt?: SignInPromptProps;
};

type LessonFooterLink = {
  title: string;
  dayNumber: number;
  href: string;
  eraLabel?: string;
  readingTimeMinutes?: number;
};
```

Client component: `MarkAsCompletedButton`, then `PreviousNextLessonNavigation` before completion or `CompletedFooter` after it (the moment → the next-lesson card → the previous link), then the `SignInPrompt` when the app says it is due. On the reader's own toggle (not a rehydration or another tab) it scrolls the moment and the next card into view (reduced-motion aware); the ask is outside that scroll target. Placeholder lessons get no button and the symmetric footer.
A11y: one persistent, initially empty `role="status"` / `aria-live="polite"` region, filled only by the reader's toggle (`completionAnnouncement`) and cleared when the lesson changes — a page load never speaks. When the sign-in ask unmounts with focus inside it, focus moves to the completion moment.

### `CompletedFooter`

```ts
type CompletedFooterProps = {
  completedDayNumber: number;
  completedCount: number; // after this completion
  totalLessons: number;
  next: CompletedFooterNext | null;
  prev: CompletedFooterPrev | null;
  resume?: CompletedFooterNext | null;
  courseHref: string;
};
```

The post-completion footer. One editorial sentence chosen by `completionMoment` (unit-tested) from the lesson's position and the course state, the labelled count `Pročitano N / 365`, then the primary paper card (`Sledeća lekcija · Dan 013`, or on the last day `Nastavi · …` to the resume lesson / `Otvori kurs`), then a quiet previous link. At 365 / 365 on the last day it becomes the course's finish: a heading, one line, `Otvori kurs`. No XP, streaks or percentages. Not a live region itself — `LessonFooter` speaks for it.

### `SignInPrompt`

```ts
type SignInPromptProps = { href: string; onDismiss: () => void };
```

The one ask for an account, under the completed footer — the app shows it after the second completed lesson, when not signed in, not dismissed, once per session. Paper card: `Nalog` eyebrow, `Sačuvaj napredak i na drugim uređajima.`, one sentence, a primary pill `Nastavi sa Google-om` (plain anchor to the sign-in route) and a quiet `Ne sada`. Never a modal. A11y: `<aside aria-labelledby>`.

### `MarkAsCompletedButton`

```ts
type MarkAsCompletedButtonProps = {
  isCompleted: boolean;
  onClick: () => void;
};
```

States (one vocabulary with every counter: the action is "pročitano"):

- not completed → `Označi kao pročitano` + check icon
- completed → `Pročitano`

A11y: `aria-pressed={isCompleted}`.

### `PreviousNextLessonNavigation`

```ts
type PreviousNextLessonNavigationProps = {
  prev: { title: string; dayNumber: number; href: string } | null;
  next: { title: string; dayNumber: number; href: string } | null;
};
```

Two links in a 2-column row (`← Dan 011` + title, `Dan 013 →` + title). At a boundary the side is an inert span: `Početak kursa · Ovo je prva lekcija` / `Kraj kursa · Ovo je poslednja lekcija`. Accepts the same `LessonFooterLink` shape as `CompletedFooter` (extra fields ignored).
A11y: `<nav aria-label="Prethodna i sledeća lekcija">`; the boundary spans carry `aria-disabled="true"`.

### `MobileLessonDrawer`

```ts
type MobileLessonDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode; // <CourseSidebar lead={era rail} />
  ariaLabel?: string; // default `Sadržaj kursa`
  id?: string; // for the trigger's aria-controls
};
```

Slide-in panel from the left, max-width 360 px or 86% viewport. Backdrop closes the drawer. Locks body scroll while open. On open it centres the current lesson's row. Since Phase 15 its list starts with the era rail (`HistoricalTimeline` `variant="compact"`, under a `Vremenska osa` eyebrow), and the lesson shell closes it when the lesson changes.
A11y: `role="dialog"` + `aria-modal`; focus traps inside the drawer when open; ESC closes; first focusable element receives focus on open; focus returns to the trigger on close.

### `CurrentLessonCard`

Floating "current lesson" mini-card used on Home: a link showing day (`formatDayEyebrow`), era short, lesson title, reading time, `CompletionDot`.

```ts
type CurrentLessonCardProps = {
  lesson: { day: number; title: string; readingTimeMinutes: number; eraShort: string };
  state: 'idle' | 'active' | 'done';
  href: string;
};
```

---

## 3. Web/mobile parity

Every component above has a planned mobile equivalent in `packages/ui-mobile`. Differences are tracked in `docs/MOBILE_NOTES.md`. Notable parity gaps anticipated:

- `LessonBody` dropcap on mobile may degrade to a styled first paragraph (no true float).
- `HistoricalTimeline` becomes horizontally scrollable with snap.
- `MobileLessonDrawer` may render as a bottom sheet on small phones — decision deferred.
- `Flourish` glyph keeps its centered hairline behavior; sized down ≥ 1px line.

---

## 4. Storybook? _(open question)_

Not in v1. Reserved for v2 if the library grows past ~25 components or if a non-engineer needs to review states in isolation.

---

## 5. File layout in `packages/ui-web`

```
packages/ui-web/src/
├─ _internal/                # progressMath (clamp, percent), shared by the ring, the bar and CourseProgress
├─ icons/
│  ├─ IconCheck.tsx
│  ├─ IconChev.tsx
│  └─ …
├─ primitives/
│  ├─ Brand/
│  │  ├─ Brand.tsx
│  │  └─ Brand.module.css
│  ├─ Button/
│  │  ├─ Button.tsx
│  │  └─ Button.module.css
│  └─ …
├─ course/
│  ├─ CourseSidebar/
│  ├─ SectionAccordion/
│  ├─ LessonNavItem/
│  ├─ HistoricalTimeline/
│  └─ …
├─ lesson/
│  ├─ LessonReader/
│  ├─ LessonHeader/
│  ├─ LessonBody/
│  └─ …
└─ index.ts
```

Every folder contains the `.tsx`, its `.module.css` and an `index.ts`. Logic worth testing lives in a pure `.ts` helper beside the component (`timelineMath`, `lessonTimelineScale`, `revealScroll`, `completionMoment`) with a Vitest `.test.ts` (node environment). There are no component render tests: rendered behaviour is covered by the Playwright e2e and axe suites in `apps/web/e2e`.
