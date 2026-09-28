# Component Library

Each shared component used by the web app, with its prop contract, visual states, accessibility notes, and mobile-equivalent considerations. Implementations live in `packages/ui-web` (web) and, eventually, `packages/ui-mobile` (mobile). Tokens come from `packages/ui`.

Components are **stateless with respect to user data**. They never call into `@learn365/core` or `@learn365/content` at runtime — the app composes data and passes props in.

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

Visual-only mark. Stateless — the host (e.g. `TopBar`) is responsible for wrapping it in the appropriate `next/link`. Renders the "H" mark + `History 365` wordmark.
A11y: accessible name comes from the host link, not from `Brand` itself.
Mobile: identical, sized down via CSS.

### `TopBar`

```ts
type TopBarRoute = 'home' | 'course' | 'lesson' | 'about';

type TopBarProps = {
  route: TopBarRoute;
  courseHref: string;
  aboutHref: string;
  totalLessons: number;
  completedCount: number;
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

A11y: wrap in `<nav aria-label="Breadcrumbs">`; a crumb with an `href` is a link wherever it sits, and only a last crumb *without* one gets `aria-current="page"` (the lesson page passes four ancestor links and no current crumb).
Mobile: shows only the last two crumbs.

### `Button`

```ts
type ButtonProps = {
  variant?: 'primary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
};
```

States: idle, hover, focus-visible, active (pressed), disabled.
The trailing arrow icon translates 2 px right on hover.
A11y: native `<button>` with type=button by default.

### `Card`

```ts
type CardProps = { as?: 'div' | 'button'; padding?: 'sm' | 'md' | 'lg'; children: ReactNode };
```

Surface with hairline border and `radii.lg`. When `as="button"`, becomes an interactive card with hover wash and focus ring.

### `ProgressBar`

```ts
type ProgressBarProps = { value: number; size?: 'thin' | 'regular' | 'thick'; ariaLabel?: string };
```

`value` is 0..1. Animates width with `duration.medium`.
A11y: `role="progressbar"` with `aria-valuenow` (0..100) and `aria-valuetext` (e.g., "1 of 365 completed").

### `ProgressRing`

```ts
type ProgressRingProps = { value: number; size?: number; stroke?: number; children: ReactNode };
```

SVG ring; child content centered. Animates with `duration.medium`.
A11y: container has `role="img"` and `aria-label="42 percent completed"`.

### `CompletionDot`

```ts
type CompletionDotProps = { state: 'idle' | 'active' | 'done' };
```

States visually:
- `idle` — empty circle, faint border
- `active` — accent border with a small accent center dot
- `done` — filled completion-color circle with white check

A11y: decorative when paired with a lesson title; given `aria-hidden="true"`. Lesson row owns the textual state announcement.

### `Chip`

```ts
type ChipProps = { variant?: 'default' | 'accent'; children: ReactNode };
```

Small pill with subtle background. Used for "u toku" on Course overview.

### `Eyebrow`

```ts
type EyebrowProps = { children: ReactNode };
```

Renders the eyebrow type class — uppercase, tracked, muted.

### `Flourish`

Decorative divider. Centered serif glyph (`✦`) with two hairlines. Hidden in Modern direction.

### `Placeholder`

```ts
type PlaceholderProps = { label?: string; ratio?: string; children?: ReactNode };
```

Dot-grid background with a label chip. Used until real imagery is authored.

### Icons

`IconCheck`, `IconChev`, `IconArrow`, `IconArrowLeft`, `IconMenu`, `IconClose`.

```ts
type IconProps = React.SVGProps<SVGSVGElement>;
```

All use `stroke="currentColor"`, no fill.

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
  onClick: () => void;
};
```

Used on Home and Course overview to render an Era row. 4-column grid on desktop (number, title block, progress block, status arrow); stacked on mobile.
States: idle, hover (subtle wash), focus-visible, current (accent title color + "u toku" chip), all-done (green checkmark).

### `CourseProgress`

```ts
type CourseProgressProps = {
  completed: number;
  total: number;
  currentLesson: { day: number; title: string; eraShort: string };
  nextLesson:    { day: number; title: string } | null;
  onOpenCurrent: () => void;
  onOpenNext:    () => void;
};
```

The progress ring card on Course overview. Shows percentage in the ring, completed-count below, and a two-row "Aktuelno" / "Sledeće" mini list with `CompletionDot`s.

### `CourseSidebar`

```ts
type CourseSidebarProps = {
  course: { id: CourseId; title: string };
  eras: Era[];
  sections: Section[];
  lessons: Lesson[];
  currentLessonId: LessonId;
  completedIds: ReadonlySet<LessonId>;
  openSectionIds: ReadonlySet<SectionId>;
  onToggleSection: (id: SectionId) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onClose?: () => void;          // mobile drawer close handle
};
```

Composes `EraGroup` → `SectionAccordion` → `LessonNavItem`. Sticky at `top: 64px`; full-height scroll with thin scrollbar.
Header shows course title and course-level progress.
A11y: `<nav aria-label="Course outline">`. Section heads are real `<button>` with `aria-expanded`. Active lesson row carries `aria-current="page"`.

### `EraGroup`

Visual grouping inside the sidebar for one Era — small Era label header followed by its `SectionAccordion`s. The Era label is not interactive; it provides chronological framing inside the sidebar.

### `SectionAccordion` *(formerly CourseSectionAccordion)*

```ts
type SectionAccordionProps = {
  section: Section;
  lessons: Lesson[];
  currentLessonId: LessonId;
  completedIds: ReadonlySet<LessonId>;
  isOpen: boolean;
  onToggle: () => void;
  onSelectLesson: (lesson: Lesson) => void;
};
```

Header row: chevron, section title with sub-eyebrow (day range), `done / total` counter.
States: collapsed, open, contains-current (subtle accent on the title).
When open, renders all its `LessonNavItem`s.
A11y: header is a `<button>` with `aria-expanded` and `aria-controls` pointing to the lesson list region id.

### `LessonNavItem`

```ts
type LessonNavItemProps = {
  lesson: Lesson;
  state: 'idle' | 'active' | 'completed';
  onClick: () => void;
};
```

Row: `CompletionDot`, day number (`D012`), lesson title, reading time.
States visualized:
- `idle` — muted text
- `active` — accent-tinted background + 2-px accent left bar
- `completed` — muted title color, completion-color day number, filled green dot

A11y: `<a>` with `aria-current="page"` if active.

### `HistoricalTimeline`

```ts
type HistoricalTimelineProps = {
  eras: Era[];
  currentLesson: { eraId: EraId; year: number };
  onJumpToEra?: (eraId: EraId) => void;
};
```

Equal-width band per Era; marker positioned proportionally inside the current Era using the lesson year. Marker animates `left` with `duration.medium`. Band labels show Era number and start year.
States: era band — idle, hover, current (accent text + heavier tick).
A11y: wrap in `<nav aria-label="Era timeline">`. Each band is a `<button>` with `aria-label="Open <Era title>"`.
Mobile: horizontally scrollable with snap; current era scrolls into view on lesson change.

### `LessonHeader`

```ts
type LessonHeaderProps = {
  lesson: Lesson;
  era: Era;
};
```

Renders the eyebrow row (`DAN xxx · ERA · x min čitanja · year`), title, subtitle, and the flourish below the subtitle.

### `LessonBody`

```ts
type LessonBodyProps = {
  blocks: LessonBlock[];
};
```

Renders structured `LessonBlock[]` content. The first `paragraph` with `dropcap: true` gets dropcap treatment. Supports `paragraph`, `heading`, `quote`, `image`.
A11y: blockquote renders inside `<blockquote>` with `<cite>` for attribution. Images require non-empty `alt`.

### `LessonReader`

Page-level composition: `Breadcrumbs` + `HistoricalTimeline` + `LessonHeader` + `Flourish` + `LessonBody` + completion strip + `PreviousNextLessonNavigation`.

```ts
type LessonReaderProps = {
  lesson: Lesson;
  era: Era;
  section: Section;
  isCompleted: boolean;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  onToggleComplete: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onNavHome: () => void;
  onNavCourse: () => void;
};
```

### `MarkAsCompletedButton`

```ts
type MarkAsCompletedButtonProps = {
  isCompleted: boolean;
  onClick: () => void;
};
```

States:
- not completed → accent button: "Označi kao završeno" + check icon
- completed → ghost button: "Označeno kao završeno"

A11y: `aria-pressed={isCompleted}`.

### `PreviousNextLessonNavigation`

```ts
type PreviousNextLessonNavigationProps = {
  prev: { title: string } | null;
  next: { title: string } | null;
  onPrev: () => void;
  onNext: () => void;
};
```

Two `Card`-styled buttons in a 2-column grid; disabled state for boundaries (course start / end).
A11y: each is a real `<button>` with `aria-disabled` when there is no neighbor.

### `MobileLessonDrawer`

```ts
type MobileLessonDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;     // typically <CourseSidebar />
};
```

Slide-in panel from the left, max-width 360 px or 86% viewport. Backdrop closes the drawer. Locks body scroll while open.
A11y: focus traps inside the drawer when open; ESC closes; first focusable element receives focus on open; focus returns to the trigger on close.

### `CurrentLessonCard`

Floating "current lesson" mini-card used on Home. Shows day, era short, lesson title, reading time, `CompletionDot`.

```ts
type CurrentLessonCardProps = {
  lesson: { day: number; title: string; readingTimeMinutes: number; eraShort: string };
  state: 'idle' | 'active' | 'done';
  onClick: () => void;
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

## 4. Storybook? *(open question)*

Not in v1. Reserved for v2 if the library grows past ~25 components or if a non-engineer needs to review states in isolation.

---

## 5. File layout in `packages/ui-web`

```
packages/ui-web/src/
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

Every folder contains the `.tsx`, its `.module.css`, and an optional `.test.tsx`.
