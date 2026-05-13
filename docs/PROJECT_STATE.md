# Project State

## Current phase

**Phase 1 — content and core packages: done.** Three workspace packages (`@learn365/content`, `@learn365/core`, `@learn365/ui`) are scaffolded, implemented, tested, and validated. Next up: **Phase 2 — Web shell** (bootstrap Next.js app, wire fonts, import `@learn365/ui/globals.css`, build TopBar and route skeleton).

## Repository identity

- Repository / umbrella platform: **Learn365**
- Product brand for v1 UI: **History 365 / Istorija 365**
- First course inside the product: **Istorija Srbije 365**
- Internal architecture uses generic concepts: `Course`, `Era`, `Section`, `Lesson`, `UserProgress`

The Learn365 name does not surface in v1 UI copy, navigation, or routes. The product feels focused on History 365.

## V1 scope

V1 ships:

- Home page
- Course overview page
- Lesson reader page
- Desktop layout (web)
- Mobile layout (responsive web)
- Course sidebar
- Collapsible sections
- Completed / active / not-started lesson states
- Mark-as-completed action
- Total progress: `x / 365 completed`
- Historical timeline (8 eras)
- Mock/seed content (≥ 6 fully-authored lessons + 359 stubs)
- Local progress state (`localStorage`)
- Editorial visual direction only

## V1 exclusions

- Payments, subscriptions
- Authentication / accounts
- Backend persistence — backend is **planned (`docs/BACKEND_STRATEGY.md`) but not built in v1**. The web v1 ships local-only.
- Push notifications
- Streaks
- Quizzes
- Admin panel / CMS
- AI content generation
- User-facing theme toggle (Modern direction stays as dev-only reference)
- Native mobile app (Expo) — planned, not implemented in v1

## Key decisions (locked)

1. **Repo name stays `Learn365`** (umbrella platform). Product UI brand is History 365.
2. **Content hierarchy**: `Course → Era → Section → Lesson`. Eras drive the historical timeline; Sections drive sidebar grouping (≈ 30–40 sections, 8–18 lessons each).
3. **v1 visual direction**: Editorial only. No user-facing toggle.
4. **Web first**. Mobile (Expo) architecture is planned; implementation is deferred until web v1 is visually approved.
5. **Content / UI isolation**: TypeScript content modules for v1; MDX migration path documented in `docs/CONTENT_AUTHORING.md`. Lesson content never lives inside React components.
6. **Tech stack**: pnpm workspaces + Turborepo, Next.js 15 App Router, TypeScript strict, CSS Modules + global token CSS variables, Zustand + persist, Vitest + Playwright.
7. **Monorepo layout**: `apps/web`, `packages/{ui, ui-web, core, content}`, plus `tooling/` and `docs/`. `apps/mobile` and `packages/ui-mobile` are introduced in the mobile phase, not before. `apps/api` is introduced in the backend phase.
8. **Backend stack**: .NET 9 Web API (C#) + SQL Server with EF Core. Planned now (`docs/BACKEND_STRATEGY.md`), **built after web v1 is visually approved**. The `ProgressStorage` adapter in `@learn365/core` is the swap seam — no v1 frontend rewrite required when the backend lands.

## Documentation foundation

Created in this commit set:

- `docs/IMPLEMENTATION_PLAN.md` — canonical plan
- `docs/APP_ARCHITECTURE.md` — monorepo, packages, dependency rules, data flow
- `docs/DESIGN_SYSTEM.md` — tokens, typography, Editorial theme, OKLCH strategy
- `docs/COMPONENT_LIBRARY.md` — every shared component, prop contracts, states, a11y
- `docs/QA_CHECKLIST.md` — phase-end regression checks
- `docs/CONTENT_AUTHORING.md` — how to add a lesson, MDX migration path
- `docs/MOBILE_NOTES.md` — planning doc for future Expo app (no code yet)
- `docs/BACKEND_STRATEGY.md` — planning doc for future .NET 9 Web API + SQL Server (no code yet)

Existing docs that remain authoritative:

- `docs/PRODUCT_BRIEF.md` — product idea, target user, scope
- `docs/UX_REQUIREMENTS.md` — IA, screen requirements, mobile patterns
- `docs/CONTENT_MODEL.md` — entity shapes, tone, lesson structure
- `docs/AGENTS.md` — agent roles and workflow
- `docs/DESIGN_REVIEW.md` — Cloud Design V1 approval

## Phase 0 — files landed

Root:

- `package.json` (root, private, `packageManager: pnpm@9.15.0`, Node `>=20.10` — upper bound dropped in Phase 1 so Node 24 works locally; CI still pins 20 via `.nvmrc`)
- `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `tooling/*`)
- `turbo.json` (tasks: `dev`, `build`, `typecheck`, `lint`, `test`, `validate-content`)
- `tsconfig.base.json` (TS strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, `moduleResolution: Bundler`)
- `.gitignore`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.npmrc`, `.nvmrc`

Tooling:

- `tooling/tsconfig/` — `@learn365/tsconfig` with `base.json`, `react-library.json`, `nextjs.json`, `node.json` presets
- `tooling/eslint-config/` — `@learn365/eslint-config` flat config: `@eslint/js` recommended + `typescript-eslint` strict & stylistic + architecture rule banning imports from `design/cloud-design-v1/`

CI:

- `.github/workflows/ci.yml` — runs on PRs and pushes to `main`; pnpm + Node via `.nvmrc`; `install → lint → typecheck → test → build → validate-content`

## Phase 1 — packages landed

`@learn365/content` ([packages/content/](packages/content/)):

- `src/types.ts` — Course / Era / Section / Lesson / LessonBlock / UserProgress / LessonState
- `src/courses/istorija-srbije-365/`
  - `course.ts` — single Course record (365 lessons, sr/latin, 8 min/lesson)
  - `eras.ts` — 8 Eras, year ranges 600 → 2026, ported from Cloud Design V1
  - `sections.ts` — 28 Sections, contiguous day ranges 1–365, 10–20 lessons each
  - `lessons/_buildStubs.ts` — pure function: walks sections, interpolates year per era, varies reading time 6–10 min
  - `lessons/titles.ts` — curated Serbian title list, one per lesson, exact array length per section
  - `lessons/authored/` — 6 hand-written seed lessons (Days 1, 7, 31, 106, 200, 305) across 5 eras
  - `lessons/index.ts` — builds full 365-lesson list with authored overlay at module load
  - `validate.ts` — enforces every invariant from CONTENT_AUTHORING.md §4
- `src/registry.ts` — public lookup API (getCourse, getEras, getSections, getLessons, getLessonById, getLessonsBySection, getLessonsByEra, getEraForLesson, getSectionForLesson, getPrevLesson, getNextLesson, etc.) backed by pre-built Maps for O(1) navigation

`@learn365/core` ([packages/core/](packages/core/)):

- `src/progress/types.ts` — ProgressStorage adapter interface, internal state shapes
- `src/progress/store.ts` — Zustand vanilla store wrapped in `persist`; `Set<LessonId>` round-trips through the supplied storage adapter via custom replacer/reviver; default key `learn365:progress:v1`
- `src/progress/selectors.ts` — pure selectors (isCompleted, completedCount, lastOpenedLessonId, progressForLessons + section/era aliases, courseProgress)
- `src/navigation/index.ts` — findPrevLesson, findNextLesson, lessonViewState
- Zero React imports — fully unit-testable

`@learn365/ui` ([packages/ui/](packages/ui/)):

- `src/tokens/` — color, typography, spacing+layout, radii, motion, elevation tokens with `*VarName` maps for CSS variable names
- `src/themes/` — Editorial (v1 default) and Modern (`data-direction="B"`, dev-only) bundles
- `scripts/emit-globals.ts` — generator emitting `dist/globals.css` (CSS variables, base typography classes, sRGB fallback, mobile overrides, reduced-motion rule) and `dist/tokens.ts` (frozen-const RN snapshot)

Test coverage (Vitest):

- 7 tests in `@learn365/ui` (token shapes, modern override semantics, layout caps)
- 27 tests in `@learn365/core` (store actions, persistence round-trip, selectors with edges, navigation)
- 24 tests in `@learn365/content` (course shape, lookups, section/era counts, authored-seed detection, prev/next chain across era boundaries)

Validator passes: 365 lessons, 28 sections, 8 eras all check out.

## Next step

Begin **Phase 2 — Web shell** per `docs/IMPLEMENTATION_PLAN.md` §10:

1. Scaffold `apps/web` as a Next.js 15 App Router app.
2. Configure `next/font` for Spectral, Inter, JetBrains Mono.
3. Import `@learn365/ui/globals.css` into `app/globals.css`.
4. Build the `TopBar` and route skeleton (`/`, `/course/[courseId]`, `/course/[courseId]/lesson/[lessonId]`).
5. Wire `ProgressStoreProvider` with a `localStorage`-backed `ProgressStorage` adapter.

The 6 authored seed lessons are Claude-drafted and need editorial review for historical voice and accuracy before any user-facing release.
