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
**Exports**: typed entity arrays/maps and lookup helpers (`getCourse`, `getLessonById`, `getLessonsBySection`, `getEraForLesson`, etc.).
**Never imports**: anything from `ui`, `ui-web`, `ui-mobile`, `core`, or any app. It is a leaf package.
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
  estimatedMinutesPerLesson: number;
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
  readingTimeMinutes: number;
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
   └─ lesson/[lessonId]/page.tsx           # Lesson reader
```

- Home is a server component.
- Course overview is mostly server, with a small client island for the progress card.
- Lesson reader is a client component (interactive: completion, prev/next, drawer).
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

CI (`.github/workflows/ci.yml`) on every PR:

```
install → lint → typecheck → test → build → validate-content → e2e (web)
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
