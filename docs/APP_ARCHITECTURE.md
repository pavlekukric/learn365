# App Architecture

How the Learn365 monorepo is organized, how its packages depend on each other, and how data flows from content modules into the rendered UI.

---

## 1. Repository identity

The repository is named **`Learn365`** — the umbrella platform concept.

The first product experience shipped inside this repository is **History 365 / Istorija 365**, and its first course is **Istorija Srbije 365**. The Learn365 name only appears at the repository / architecture layer. It does not surface in product UI, copy, or routes for v1.

---

## 2. Monorepo layout

```
learn365/
├─ apps/
│  ├─ web/                        # Next.js 15 — phase 1; Phase 8 adds lib/server + app/api (auth, progress sync)
│  └─ mobile/                     # Expo — created in mobile phase
├─ packages/
│  ├─ ui/                         # Design tokens + themes + cross-platform contracts
│  ├─ ui-web/                     # React + CSS Modules components for web
│  ├─ ui-mobile/                  # RN components — created in mobile phase
│  ├─ core/                       # Platform-agnostic logic (progress, navigation)
│  └─ content/                    # Course/era/section/lesson data + validation
├─ tooling/
│  ├─ eslint-config/
│  └─ tsconfig/                   # base, web, mobile, package presets
├─ design/cloud-design-v1/        # Visual reference — never imported by app code
├─ docs/
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
└─ package.json
```

`apps/mobile` and `packages/ui-mobile` do not exist in phase 1. They appear only when mobile work begins (after web v1 is visually approved). There is no `apps/api`: the backend (Phase 8) is route handlers inside `apps/web` — see `docs/BACKEND_STRATEGY.md`.

---

## 3. Package responsibilities

### `packages/content`
**Owns**: the structured course data — `Course`, `Era`, `Section`, `Lesson` records.
**Exports**: two entries (Phase 9). `@learn365/content` — course / era / section records, the `LessonSummary` navigation index (`id`, `courseId`, `sectionId`, `eraId`, `dayNumber`, `order`, `title`, `readingTimeMinutes`, `year`, `isPlaceholder`; ~9 kB gzip for 365 lessons) and every lookup helper (`getCourse`, `getLessonById`, `getLessonsBySection`, `getEraForLesson`, etc.); safe to import from client components. `@learn365/content/server` — `getLessonArticle` (the `LessonArticle`: `content`, `sources`, `byline`, `lastReviewedAt`, `summary`, `keyPeople`, `keyPlaces`, `subtitle`, `dateLabel`, `timelinePosition`); it carries `import 'server-only'`, so a client import fails the build. The split is one constant, `LESSON_ARTICLE_KEYS` in `src/types.ts`; `pnpm gen-content` writes `_generated.ts` and `_generated.articles.ts` from one load.
**Never imports**: anything from `ui`, `ui-web`, `ui-mobile`, `core`, or any app. It is a leaf package (its only runtime dependency is the `server-only` marker).
**Side rule**: lesson body text is structured (`LessonBlock[]`), never a React component. The MDX migration path uses the same exit shape.

### `packages/ui`
**Owns**: design tokens (color, typography, spacing, radii, motion, elevation) and theme bundles (Editorial; Modern is included as a reference but not exposed at runtime in v1).
**Exports**: TS constants + CSS variable generator + RN-compatible token bundle.
**Never imports**: from `core`, `content`, `ui-web`, `ui-mobile`, or apps.

### `packages/ui-web`
**Owns**: every React component used by the web app (primitives and surfaces).
**Imports**: tokens from `ui`. Type-only imports from `content` for prop shapes. **Does not import** from `core` (no progress-store reads inside components — the app composes state in).
**Styling**: CSS Modules per component, plus a single `globals.css` published as a side-effect import for consumers.

### `packages/core`
**Owns**: `ProgressStore` (Zustand), storage adapter interface, prev/next navigation helpers, completion selectors.
**Imports**: type-only from `content`.
**Never imports**: from `ui`, `ui-web`, `ui-mobile`, or apps.
**Constraint**: no React imports anywhere — pure TS so it can be unit-tested without a renderer.

### `apps/web`
**Owns**: route files, page-level composition, fonts setup, web-specific storage adapter, `ProgressStoreProvider`.
**Imports**: from `ui-web`, `core`, `content`, `ui`.

### `apps/mobile` *(future)*
Same role for Expo. Imports `ui-mobile`, `core`, `content`, `ui`.

### `apps/web/lib/server` + `apps/web/app/api` *(Phase 8 — backend inside the web app)*
**Owns**: Google sign-in, sessions, and cloud progress / bookmarks per `(userId, courseId)`, exposed as route handlers (`/api/auth/*`, `/api/me`, `/api/me/progress*`, `/api/me/bookmarks*`, `/api/health`). Postgres via Drizzle; PGlite locally.
**Imports**: `@learn365/content` (lesson-id validation) only. Every module carries `import 'server-only'` so it can never reach a client bundle.
**Does not own**: course / era / section / lesson data — those stay in `@learn365/content`. See `docs/BACKEND_STRATEGY.md`.

---

## 4. Dependency rules

Allowed import directions (→ means "may import from"):

```
apps/web      →  ui-web, core, content, ui
apps/mobile   →  ui-mobile, core, content, ui
apps/web/lib/server →  content (id validation) only — never ui-web, never the core stores
apps/web (server components, sitemap) →  content/server (lesson articles) — never from a 'use client' module
ui-web        →  ui  (+ types from content)
ui-mobile     →  ui  (+ types from content)
core          →  (types from content only)
content       →  — nothing
ui            →  — nothing
```

Disallowed (must trigger a lint or review):

- `ui-web` importing from `core`
- `core` importing React
- `content` importing anything outside its own package
- Any app importing `design/cloud-design-v1/*`
- `apps/web/lib/server/**` imported from a client component — the `server-only` package fails the build
- `@learn365/content/server` imported from a client component — the same `server-only` guard; the lesson articles never reach a browser bundle (Phase 9), and `pnpm --filter @learn365/web check-bundle` fails CI if a route grows past 175 kB gzip anyway

These rules keep content portable across platforms, keep the progress logic testable in isolation, keep components stateless with respect to user data, and keep server code out of the browser bundle.

---

## 5. Data flow

```
content modules (TS, static)
        │
        ▼
content lookup helpers  ────►  app route layer (Next.js / Expo)
                                       │
ProgressStore (Zustand) ◄──────────────┤   (route reads progress + lesson)
        │                              │
        ▼                              ▼
storage adapter            UI components (ui-web / ui-mobile)
   (localStorage /
    AsyncStorage)
```

- The app route reads the current `lessonId` from URL params, calls `content` lookups to get the `Lesson`, `Section`, `Era`, and the surrounding lessons.
- The app route subscribes to `ProgressStore` to get `isCompleted`, `completedCount`, `lastOpenedLessonId`, and `periodProgress`.
- The route passes plain props into stateless `ui-web` components.
- Completion clicks bubble back up to a `toggleComplete(lessonId)` handler that the route owns.

---

## 6. State management

### ProgressStore (Zustand)

```ts
// packages/core/progress/store.ts
interface ProgressState {
  byCourse: Record<CourseId, {
    completedLessonIds: Set<LessonId>;
    lastOpenedLessonId: LessonId | null;
    updatedAt: string;
  }>;
  toggleComplete(courseId: CourseId, lessonId: LessonId): void;
  markOpened(courseId: CourseId, lessonId: LessonId): void;
  resetCourse(courseId: CourseId): void;
}
```

Selectors (pure functions exported alongside the store):

```ts
isCompleted(state, courseId, lessonId): boolean
completedCount(state, courseId): number
sectionProgress(state, courseId, sectionId): { done, total, pct }
eraProgress(state, courseId, eraId): { done, total, pct }
courseProgress(state, courseId): { done, total, pct, remaining }
```

### Persistence

Zustand `persist` middleware with a swappable storage adapter:

```ts
interface ProgressStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}
```

- `apps/web` provides a `localStorage`-backed adapter under key `learn365:progress:v1`.
- `apps/mobile` (later) provides an `AsyncStorage`-backed adapter.
- Phase 8 keeps the `localStorage` adapter and adds a sync layer beside the store (`ProgressSync`: server snapshot → `replaceCourseProgress`, local diffs → `PATCH /api/me/progress`). The store, selectors and components don't change. See `docs/BACKEND_STRATEGY.md`.

`Set<LessonId>` serializes to `string[]` on write and rehydrates to a `Set` on read.

A `migrate(state, fromVersion)` function is wired from v1 to handle shape changes later.

---

## 7. Content model

Mirrors `docs/CONTENT_MODEL.md`. Generic entity names in code, History-365-specific values in data files.

```ts
type CourseId = string;
type EraId = string;
type SectionId = string;
type LessonId = string;

interface Course {
  id: CourseId;
  title: string;
  subtitle: string;
  description: string;
  totalLessons: number;             // 365 for the first course
  language: 'sr';
  defaultScript: 'latin' | 'cyrillic';
  estimatedMinutesPerLesson: number; // derived: median of the lessons' reading minutes (Phase 11)
}

interface Era {                     // a.k.a. HistoricalPeriod
  id: EraId;
  courseId: CourseId;
  num: string;                      // "I" … "VIII"
  title: string;
  description: string;
  yearStart: number;
  yearEnd: number;
  yearsLabel: string;
  eraShort: string;
  order: number;
}

interface Section {                 // a.k.a. Chapter
  id: SectionId;
  courseId: CourseId;
  eraId: EraId;
  title: string;
  subtitle?: string;
  order: number;
  startDay: number;
  endDay: number;
}

type LessonBlock =
  | { type: 'paragraph'; text: string; dropcap?: boolean }
  | { type: 'heading';   level: 2 | 3; text: string }
  | { type: 'quote';     text: string; attribution?: string }
  | { type: 'image';     src: string; alt: string; caption?: string };

interface Lesson {
  id: LessonId;
  courseId: CourseId;
  sectionId: SectionId;
  eraId: EraId;
  dayNumber: number;                // 1..365 unique within course
  title: string;
  subtitle?: string;
  readingTimeMinutes: number;       // derived from the text by the loader (Phase 11), never authored
  year: number;
  dateLabel?: string;
  timelinePosition?: string;
  content: LessonBlock[];           // structured body — never a React node
  summary?: string;
  keyPeople?: string[];
  keyPlaces?: string[];
  order: number;
}
```

A `validate.ts` script enforces invariants at build time:

- Day numbers are unique within a course and cover 1..365.
- Section `[startDay, endDay]` ranges are contiguous and partition the course.
- Each Section's Era matches its lessons' Era.
- Era year ranges are monotonic and cover the course span.
- No orphan IDs.

---

## 8. Routing

### Web (Next.js App Router)

```
app/
├─ layout.tsx                              # TopBar + theme provider + fonts
├─ page.tsx                                # Home
├─ globals.css                             # token CSS variables + base
├─ providers.tsx                           # ProgressStoreProvider (client)
└─ course/[courseId]/
   ├─ page.tsx                             # Course overview
   └─ lesson/
      ├─ layout.tsx                        # Persistent shell: outline, drawer, sticky header (Phase 15)
      └─ [lessonId]/page.tsx               # Lesson reader — the article, server-rendered
```

- Home is a server component.
- Course overview and every lesson page are prerendered at build time (Phase 9: `generateStaticParams` + `dynamicParams = false`, 366 pages) — they are pure functions of the content registry; unknown ids are a router 404.
- Course overview is mostly server, with client islands for the progress card, the bookmarks list and the era accordion (all reading the `LessonSummary` index).
- The lesson route is two layers (Phase 15). **The shell** — `lesson/layout.tsx` → `LessonShell` (client) — owns what belongs to the course: the sticky `CourseSidebar`, the `MobileLessonDrawer` (era rail + outline), the `LessonContextHeader`, the reading hairline, the open-era / open-section sets and `markOpened`. It reads the open lesson from `useParams()` and the `LessonSummary` index, and because a layout survives navigation between its pages, previous / next keeps the outline's scroll position and expansions. **The page** renders `LessonReader` on the server — trail, header and the *article* (`LessonBody` + `LessonSources` + `LessonTrustLine`, from `@learn365/content/server`) — and hands in three client islands as nodes: `LessonBookmarkToggle`, `LessonCompletion` (the footer: completion, prev / next, the sign-in ask) and `LessonEraStrip`. No client component ever sees a lesson body.
- All progress reads happen client-side. SSR renders unauthenticated, baseline state.

### Mobile *(future, Expo Router)*

```
app/
├─ _layout.tsx
├─ index.tsx                               # Home
└─ course/[courseId]/
   ├─ index.tsx                            # Course overview
   └─ lesson/[lessonId].tsx                # Lesson reader
```

---

## 9. Styling architecture (web)

- Tokens authored in `packages/ui/src/tokens` as TS constants.
- A generator emits `globals.css` containing `:root { --bg: …; --ink: …; … }` for each token, plus base resets and typography classes.
- Components use CSS Modules (`.module.css`) and reference tokens via `var(--bg)` etc.
- Theme switching happens via `data-direction="A"` on `<html>`. v1 always renders A; the attribute exists for future toggling but no UI exposes it.
- OKLCH is used directly. A small `@supports not (color: oklch(0 0 0))` block provides sRGB fallbacks for the critical tokens.

---

## 10. Fonts

- **Spectral** (serif): 300, 400, 500 + italics
- **Inter** (sans): 400, 500, 600
- **JetBrains Mono** (mono): 400, 500

Web: `next/font/google` with `display: 'swap'` and preload on critical weights.
Mobile (later): bundled via `expo-font`.

---

## 11. Testing strategy

| Surface | Tool | Scope |
|---|---|---|
| `packages/core` | Vitest | Pure unit tests for store + selectors |
| `packages/content` | Vitest | Invariant validation, lookup helpers |
| `packages/ui-web` | Vitest + RTL | Component states, accessibility roles |
| `apps/web` | Playwright | Full flows: open → complete → persist |
| `apps/web` visual | Playwright snapshots | Three screens, desktop + 375 px |

Coverage targets are not enforced by number; review insists on tests for `core` and for any component with non-trivial logic (sidebar, timeline, completion).

---

## 12. Build pipeline

Turborepo pipeline (`turbo.json`):

```
dev          — apps + watch packages
build        — packages first, then apps
typecheck    — every package, no emit
lint         — every package
test         — every package
validate-content — pnpm --filter @learn365/content validate
```

CI (`.github/workflows/ci.yml`) on every PR and push to `main`, two jobs in parallel (Phase 10). Deploy (`.github/workflows/deploy.yml`) starts only from a green CI on `main` (`workflow_run`; `docs/DEPLOY.md` §4):

```
validate: install → validate-content → gen-content drift check → lint → typecheck → test → build → bundle budget
e2e:      install → chromium → build → playwright (chromium-desktop + chromium-mobile)
```

---

## 13. Naming conventions

- Workspace packages: `@learn365/content`, `@learn365/core`, `@learn365/ui`, `@learn365/ui-web`, etc.
- Entity types: `Course`, `Era`, `Section`, `Lesson`, `UserProgress`.
- IDs: kebab-case strings (`istorija-srbije-365`, `nemanjici`, `nemanjici-rani`, `nemanjici-rani-001`).
- Day numbers: 1-indexed, formatted in UI as `DAN 001`.
- React components: PascalCase; files match the component name.
- CSS Module files: `Component.module.css` next to `Component.tsx`.

---

## 14. What stays out

- Backend: Phase 8 (Google sign-in + cloud progress) as route handlers inside `apps/web` — see `docs/BACKEND_STRATEGY.md` and `docs/archive/phases/PHASE_8_PLAN.md`. v1 shipped with local progress only.
- No CMS or admin UI in v1.
- No analytics SDK in v1 (decision deferred).
- No internationalization framework yet — copy is Serbian only.
- No icon font; SVG components are inlined.
- No CSS-in-JS runtime library.
