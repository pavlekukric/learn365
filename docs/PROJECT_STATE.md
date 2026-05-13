# Project State

## Current phase

**Phase 2 — Web shell: done.** `apps/web` is scaffolded as a Next.js 15 App Router project. Fonts (Spectral, Inter, JetBrains Mono) are wired via `next/font` and bound to the `--serif` / `--sans` / `--mono` tokens emitted by `@learn365/ui`. The `TopBar` ships sticky, translucent, with live progress (`xxx / 365`) read from the Zustand store via a React provider over the `localStorage`-backed adapter. All three routes (`/`, `/course/[courseId]`, `/course/[courseId]/lesson/[lessonId]`) render real content from `@learn365/content` and the lesson reader toggles completion. Workspace `typecheck`, `lint`, `test`, and `build` all pass. Next up: **Phase 3 — Web components** — extract reusable primitives + surfaces into `packages/ui-web` (Sidebar, EraTimeline, ProgressRing, etc.).

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

## Phase 2 — files landed

`apps/web` ([apps/web/](apps/web/)) — Next.js 15 App Router shell:

- `package.json` — `@learn365/web`, depends on `next ^15.1.3`, `react ^19.0.0`, plus the three workspace packages.
- `next.config.mjs` — `reactStrictMode`, `transpilePackages`, `typedRoutes`, and a webpack `extensionAlias` rule (`.js → .ts/.tsx/.js`) so workspace packages' explicit-extension TS imports resolve correctly.
- `tsconfig.json` — extends `@learn365/tsconfig/nextjs.json`, adds `@/*` path alias, picks up `.next/types/routes.d.ts` via `next-env.d.ts`.
- `eslint.config.mjs` — wraps shared flat config, scopes JSX parser options to `**/*.{ts,tsx}`.
- `app/layout.tsx` — root layout: `<html lang="sr" data-direction="A">`, font CSS variables on `<html>`, `AppProviders` wrapping the tree, sticky `TopBarHost`.
- `app/globals.css` — imports `@learn365/ui/globals.css`, rebinds `--serif`/`--sans`/`--mono` to next/font variables, defines the `.shell` layout wrapper.
- `app/providers.tsx` — top-level `AppProviders` (currently just `ProgressStoreProvider`).
- `app/page.tsx` — Home: hero, eight-era list, CTA to course overview.
- `app/course/[courseId]/page.tsx` — Course overview: per-era headers + section rows with day ranges.
- `app/course/[courseId]/lesson/[lessonId]/page.tsx` — Lesson route (server): looks up lesson + era + section + prev/next.
- `app/course/[courseId]/lesson/[lessonId]/LessonReader.tsx` — Reader client island: subscribes to progress, toggles completion, marks-opened on mount, renders prev/next.
- `app/course/[courseId]/lesson/[lessonId]/LessonBody.tsx` — `LessonBlock[] → React` renderer (paragraph/dropcap, heading 2/3, blockquote, figure placeholder).
- `app/not-found.tsx` — minimal 404.
- `components/top-bar/TopBar.tsx` + `.module.css` — stateless presentational TopBar (brand, nav, progress chip, mobile collapse).
- `components/top-bar/TopBarHost.tsx` — `'use client'` host: derives route from `usePathname()`, reads `completedCount` from the store.
- `lib/fonts/fonts.ts` — `next/font/google` setup for Spectral / Inter / JetBrains Mono with CSS variables.
- `lib/progress/localStorageAdapter.ts` — `ProgressStorage` implementation guarded for SSR.
- `lib/progress/ProgressStoreProvider.tsx` — `'use client'` Provider: instantiates the vanilla Zustand store once via `useRef`, exposes it through React context, and a `useProgressStore(selector)` hook.

The store wiring is the swap seam called out in `docs/APP_ARCHITECTURE.md` §6: replacing the adapter with `RemoteProgressStorage` in the backend phase (Phase 8d) will not require any component changes.

## Next step

Begin **Phase 3 — Web components** per `docs/IMPLEMENTATION_PLAN.md` §10. Phase 3 lifts the local TopBar (and adds Sidebar, EraTimeline, ProgressRing, LessonNavItem, MobileLessonDrawer, etc.) into `packages/ui-web`. Phase 4 then composes the full screens against those components.

The 6 authored seed lessons are Claude-drafted and need editorial review for historical voice and accuracy before any user-facing release.
