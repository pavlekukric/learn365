# Project State

## Current phase

**Phase 5 — Web polish + QA: done.** All engineering gates closed; cross-browser visual review passed manually on Chrome / Firefox / Safari on Windows. Skip link (`Preskoči na sadržaj`) is the first tab stop and targets `<main id="main-content" tabIndex={-1}>`; Home hero CTA + course-overview start link have explicit `:focus-visible` accent rings; `MobileLessonDrawer` backdrop demoted to an `aria-hidden` `<div>` (no longer in the Tab cycle) and initial focus routed to the close button. Playwright suite is wired with **6 tests × 5 browser profiles (chromium-desktop, firefox-desktop, webkit-desktop, chromium-mobile, webkit-mobile) = 30 runs, 28 pass / 2 skipped** (the 2 skips are documented WebKit Tab-skips-anchors quirk on the skip-link assertion only). The suite covers: hero/CTA visible, 8 era cards on overview, mark-completed toggles label, completion persists across reload, skip-link tab-to-Enter path, and a `prefers-reduced-motion` assertion that confirms the timeline marker's transition collapses to <1ms when the OS preference is set. Lighthouse scores against `next start` (lighthouse@12 desktop preset + default mobile preset):

| Route | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| home-desktop | 100 | 100 | 100 | 100 |
| course-desktop | 100 | 100 | 100 | 100 |
| lesson-desktop | 99 | 100 | 100 | 100 |
| home-mobile | 85 | 100 | 100 | 100 |
| course-mobile | 82 | 100 | 100 | 100 |
| lesson-mobile | 83 | 100 | 100 | 100 |

Desktop hits the ≥95 QA target on every category for every route. Mobile A11y / Best Practices / SEO all 100. **Mobile performance 82–85, accepted for v1 (below the ≥90 QA target).** Root cause is the three Google fonts (Spectral + Inter + JetBrains Mono) all loading on the simulated slow-4G + 4× CPU profile — LCP is gated on Spectral serif. Closing the 5–8 point gap would require an architecture change (drop a font family, self-host + inline critical CSS, or system-fonts-first with progressive enhancement) that conflicts with the Editorial typography direction. Risk recorded in `docs/IMPLEMENTATION_PLAN.md` §13 and revisited only if real-user metrics indicate a regression vs. expectation.

Fixes landed during Phase 5 from Lighthouse findings: (a) WCAG-fail contrast on the active `LessonNavItem` row — `.day` and `.meta` ramps promoted from `--muted`/`--faint` to `--ink-2` on `--accent-soft` background; (b) WCAG 2.5.3 "Label in Name" violations on the Brand link (`aria-label="History 365 — Početna"` removed; inner text "History 365 / Istorija 365" is now the accessible name) and on `HistoricalTimeline` band links (`aria-label="Otvori epohu …"` prefix removed); (c) `/favicon.ico` 404 silenced by adding `apps/web/app/icon.svg` (Editorial green tile with serif "H"); (d) `Inter` weight `600` dropped from `apps/web/lib/fonts/fonts.ts` (it was requested but never used in CSS).

Manual gates still outstanding before Phase 6 release: VoiceOver / NVDA screen-reader smoke on TopBar nav + breadcrumbs + accordion + completion button; editorial review of the 6 authored seed lessons for historical voice and accuracy.

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
- `components/top-bar/TopBarHost.tsx` — `'use client'` host: derives route from `usePathname()`, reads `completedCount` from the store, and now renders `<TopBar>` imported from `@learn365/ui-web` (the local `TopBar.tsx` + module CSS were removed in Phase 3).
- `lib/fonts/fonts.ts` — `next/font/google` setup for Spectral / Inter / JetBrains Mono with CSS variables.
- `lib/progress/localStorageAdapter.ts` — `ProgressStorage` implementation guarded for SSR.
- `lib/progress/ProgressStoreProvider.tsx` — `'use client'` Provider: instantiates the vanilla Zustand store once via `useRef`, exposes it through React context, and a `useProgressStore(selector)` hook.

The store wiring is the swap seam called out in `docs/APP_ARCHITECTURE.md` §6: replacing the adapter with `RemoteProgressStorage` in the backend phase (Phase 8d) will not require any component changes.

## Phase 3 — files landed

`@learn365/ui-web` ([packages/ui-web/](packages/ui-web/)) — stateless React + CSS Modules component library:

- `package.json` — `@learn365/ui-web`, peer-deps on `react ^19` / `react-dom ^19`, depends on `next ^15.1.3` (uses `next/link` in nav surfaces), `@learn365/content`, `@learn365/ui`. Exports `.` / `./icons` / `./primitives` / `./course` / `./lesson`.
- `tsconfig.json` — extends `@learn365/tsconfig/react-library.json` with `noEmit: true`. `src/css-modules.d.ts` shims `*.module.css` for `tsc`.
- `eslint.config.mjs` — wraps shared flat config and turns on the JSX parser for `**/*.{ts,tsx}`.
- `vitest.config.ts` — `node` env, includes `src/**/*.test.{ts,tsx}`.

Component inventory (each is a folder with `Component.tsx`, `Component.module.css`, `index.ts`):

- `src/icons/` — `IconCheck`, `IconChev`, `IconArrow`, `IconArrowLeft`, `IconMenu`, `IconClose` (all `currentColor`, no fill).
- `src/primitives/` — `Brand`, `TopBar` (Editorial sticky header lifted from `apps/web`), `Breadcrumbs`, `Button` (primary/accent/ghost × sm/md/lg with hover-translate trailing icon), `Card` (`as: 'div' | 'button'`), `Chip` (default/accent), `CompletionDot` (idle/active/done), `Eyebrow`, `Flourish` (✦ divider; hidden under `[data-direction="B"]`), `Placeholder` (dot-grid + label chip), `ProgressBar` (thin/regular/thick + ARIA), `ProgressRing` (SVG circle math + ARIA).
- `src/course/` — `LessonNavItem` (next/link row with active left-bar + completion dot), `SectionAccordion` (button header with `aria-expanded` + `aria-controls`, lessons list with `useId` for panel id), `EraGroup`, `CourseSidebar` (course header + progress bar + Era→Section→Lesson tree, optional `onClose` renders mobile close handle), `CourseCard` (4-col grid era row, hover-shifted arrow, green check when done), `CourseProgress` (ring + "Aktuelno" / "Sledeće" rows), `CurrentLessonCard` (floating elev card for the Home hero).
- `src/lesson/` — `LessonBody` (lifted `LessonBlock[]` renderer), `LessonHeader` (eyebrow + reader-title + lede + `Flourish`), `MarkAsCompletedButton` (accent/ghost variants, `aria-pressed`), `PreviousNextLessonNavigation` (2-col grid with disabled-edge states), `HistoricalTimeline` (8 era bands, animated marker positioned by `markerPositionPercent(eras, eraId, year)`, optional `eraHref` for jump-to-era), `MobileLessonDrawer` (`role="dialog" aria-modal`, body scroll lock, ESC closes, Tab/Shift+Tab focus trap, focus restore on close), `LessonReader` (page-level composition: breadcrumbs + timeline + header + body + completion + prev/next).
- `src/_internal/progressMath.ts` — `clamp01`, `toPercentInt` shared by ProgressBar/Ring/CourseProgress.

Test coverage (Vitest, 13 tests across 2 files):

- `src/_internal/progressMath.test.ts` — clamp + percent rounding edge cases (NaN, Infinity, negative, > 1).
- `src/lesson/HistoricalTimeline/timelineMath.test.ts` — marker position math, including zero-width era, out-of-range year clamping, and unknown era fallback.

Component prop contracts intentionally deviate from `docs/COMPONENT_LIBRARY.md` in one consistent way: **navigation actions accept `href: string` (anchor-rendered via `next/link`) instead of `onClick: () => void` callbacks**. This preserves middle-click / right-click / new-tab semantics that the Editorial direction needs. State actions (toggle complete, open accordion, close drawer) remain callbacks. `COMPONENT_LIBRARY.md` should be revised in Phase 4 or 5 to match.

`apps/web` integration in Phase 3:

- `apps/web/package.json` — added `@learn365/ui-web: workspace:*`.
- `apps/web/next.config.mjs` — added `@learn365/ui-web` to `transpilePackages`.
- `apps/web/components/top-bar/TopBarHost.tsx` — imports `TopBar` / `TopBarRoute` from `@learn365/ui-web` (was `./TopBar`). The local `TopBar.tsx` + `.module.css` were deleted.

No screen rewiring yet — Phase 4 will compose the remaining surfaces into `/`, `/course/[courseId]`, and `/course/[courseId]/lesson/[lessonId]`.

## Phase 4 — files landed

`apps/web` ([apps/web/](apps/web/)) — all three screens now compose `@learn365/ui-web`. Server pages stay thin: they load content + delegate to small client islands that subscribe to the progress store.

Home (`/`):

- `app/page.tsx` — server component: hero (eyebrow + display title + lede + description + CTA) + `<HomeCurrentLessonCard>` + `<HomeErasList>`.
- `app/_components/HomeCurrentLessonCard.tsx` — `'use client'`: reads `lastOpenedLessonId` + `isCompleted` from the store; falls back to lesson 1 when no lesson has been opened. Renders `CurrentLessonCard` from ui-web with `state ∈ {idle, active, done}`.
- `app/_components/HomeErasList.tsx` — `'use client'`: walks `getEras` + `getLessonsByEra`, computes `progressForLessons` per era, derives `isCurrent` (era contains `lastOpenedLessonId` and is not all done) + `isAllDone`. Renders one `CourseCard` per era linking to that era's first lesson.

Course overview (`/course/[courseId]`):

- `app/course/[courseId]/page.tsx` — server component: header (eyebrow + h1 + lede + "Počni od Dana 001 →" link) + `<CourseOverviewProgress>` + `<CourseOverviewEras>`.
- `app/course/[courseId]/_components/CourseOverviewProgress.tsx` — `'use client'`: `CourseProgress` ring with completed count + "Aktuelno" current (last-opened, defaults to lesson 1) + "Sledeće" next uncompleted lesson.
- `app/course/[courseId]/_components/CourseOverviewEras.tsx` — `'use client'`: per-era block — `CourseCard` (live progress) + era description + section rows (`D001–D012`, title, count). Same `isCurrent`/`isAllDone` rules as Home.

Lesson reader (`/course/[courseId]/lesson/[lessonId]`):

- `app/course/[courseId]/lesson/[lessonId]/page.tsx` — server component: looks up course, lesson, era, section, prev/next. `notFound()` when any of those are missing. Delegates to `<LessonPageClient>` with serializable props.
- `app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — `'use client'`: owns `openSectionIds` (initialised to the current lesson's section, auto-expands on navigation) + `drawerOpen` state, calls `markOpened` on mount, derives a `lessonHref(lesson)` builder for the sidebar/timeline, and an `eraHref(eraId)` builder for the timeline's jump-to-era. Renders the two-column layout (sticky `CourseSidebar` + flex reader) on desktop and a mobile fallback (sticky outline-button bar + `LessonReader`); the mobile drawer hosts the same `CourseSidebar` with `onClose`.
- `app/course/[courseId]/lesson/[lessonId]/LessonPageClient.module.css` — grid layout with `sidebar-width / 1fr` at desktop, single-column + visible mobile bar at `max-width: 1024px`. Sidebar column is `position: sticky` under the top bar.

Removed in Phase 4 (replaced by `@learn365/ui-web`):

- `app/course/[courseId]/lesson/[lessonId]/LessonReader.tsx`
- `app/course/[courseId]/lesson/[lessonId]/LessonReader.module.css`
- `app/course/[courseId]/lesson/[lessonId]/LessonBody.tsx`
- `app/course/[courseId]/lesson/[lessonId]/LessonBody.module.css`

`apps/web` did **not** add a TopBar hamburger. The mobile course-outline trigger lives in the lesson page itself (a sticky "Sadržaj" pill above the reader, visible at `≤ 1024 px`). TopBar still collapses gracefully (hides "O aplikaciji" at `≤ 720 px`, tightens nav gaps at `≤ 560 px`).

One ui-web prop tweak landed in Phase 4 to satisfy `exactOptionalPropertyTypes`: `BreadcrumbItem.onClick` is now typed as `MouseEventHandler<HTMLButtonElement> | undefined` so callers can pass `{ label, onClick: undefined }` cleanly.

Smoke verification (production build + `next start`):

- `GET /` → 200, hero + era list render.
- `GET /course/istorija-srbije-365` → 200, course overview renders with eight era cards.
- `GET /course/istorija-srbije-365/lesson/praistorija-i-antika-001` → 200, contains `DAN 001`, `Označi kao završeno`, `Vremenska osa epoha`, and `Sadržaj kursa` in the SSR HTML.

## Phase 5 — files landed

`apps/web` ([apps/web/](apps/web/)):

- `app/layout.tsx` — skip link inserted before `TopBarHost`; `<main id="main-content" tabIndex={-1}>` is the link target.
- `app/globals.css` — `.skip-link` utility (translated off-screen until `:focus-visible`), plus a `main:focus { outline: none }` rule so programmatic skip-link focus doesn't paint an outline.
- `app/page.module.css` — `:focus-visible` accent ring on `.ctaPrimary`.
- `app/course/[courseId]/page.module.css` — `:focus-visible` accent ring on `.startLink`.
- `app/icon.svg` — minimal Editorial favicon (accent-green tile + serif "H"); silences the prior `/favicon.ico` 404 console error.
- `lib/fonts/fonts.ts` — `Inter` weight `600` removed (was requested but never used).
- `playwright.config.ts` — `next start --port 3100` web server; 5 projects: `chromium-desktop`, `firefox-desktop`, `webkit-desktop`, `chromium-mobile` (Pixel 7), `webkit-mobile` (iPhone 14); list reporter.
- `e2e/smoke.spec.ts` — 6 tests × 5 browser profiles. Cases: hero/CTA visible, 8 era cards on overview, mark-completed toggles label, completion persists across reload, skip-link tab-to-Enter path (skipped on WebKit — documented quirk where Safari's Tab navigation does not focus anchors by default), reduced-motion collapses timeline-marker transition to <1ms.
- `vitest.config.ts` — scopes Vitest to colocated `app|components|lib` tests; excludes `e2e/`.
- `tsconfig.json` — adds `e2e` + `playwright.config.ts` to `exclude` so they don't enter the Next build typecheck.
- `tsconfig.e2e.json` — separate Node-only tsconfig if the developer wants to typecheck e2e sources directly.
- `eslint.config.mjs` — ignores `e2e/**` and `playwright.config.ts` (Playwright sources have their own conventions and global types).
- `package.json` — `@playwright/test ^1.49.1` devDep and `"test:e2e": "playwright test"` script.

`@learn365/ui-web` ([packages/ui-web/](packages/ui-web/)):

- `src/lesson/MobileLessonDrawer/MobileLessonDrawer.tsx` — backdrop demoted to an `aria-hidden` `<div>`; initial focus is routed to the close button (`button[data-drawer-close]`) via an explicit query before falling back to the generic `FOCUSABLE_SELECTOR`. Body scroll lock, ESC, Tab/Shift+Tab cycle, and focus restore on close remain unchanged.
- `src/lesson/MobileLessonDrawer/MobileLessonDrawer.module.css` — drops the legacy `button` resets (`border: 0; padding: 0`) on `.backdrop` now that it's a div.
- `src/primitives/TopBar/TopBar.tsx` — Brand link `aria-label` removed; inner text ("History 365 / Istorija 365") is the accessible name. Fixes WCAG 2.5.3 "Label in Name".
- `src/lesson/HistoricalTimeline/HistoricalTimeline.tsx` — band-link `aria-label="Otvori epohu …"` prefix removed; inner text is the accessible name. Fixes WCAG 2.5.3.
- `src/course/LessonNavItem/LessonNavItem.module.css` — on `state_active`, `.day` and `.meta` promoted from `var(--muted)` / `var(--faint)` to `var(--ink-2)` so contrast over the `--accent-soft` background stays above 4.5:1.

Root:

- `.gitignore` — added `lighthouse-*.json` / `lighthouse-*.html` so ad-hoc Lighthouse runs don't leak into commits.

## Phase 6 — web release: done

Web v1 is live on Vercel at **<https://learn365-web.vercel.app/>** (project `learn365-web`).

- **Host**: Vercel. Root Directory `apps/web`; build `cd ../.. && pnpm --filter @learn365/web... build`; install `cd ../.. && pnpm install --frozen-lockfile`; Node 20.
- **Domain**: Vercel project subdomain. Custom domain deferred.
- **Env vars**: none.
- **Branch model**: `main` → production, every PR → preview URL.
- **No `vercel.json`** in the repo — all config lives in Vercel project settings. Procedure is canonical in `docs/DEPLOY.md`.

**The two Phase 5 manual gates were overridden, not cleared** (deliberate product decision, 2026-05-14). The site shipped with them still open.

## Phase 6.1 — mobile polish pass: done

A focused UI refinement pass over the live web v1 — mobile-first, no architectural changes, identity preserved. Engineering gates all green: typecheck, lint, 58 unit tests, production build, `validate-content` (365/28/8), and Playwright **7 tests × 5 profiles = 35 runs, 33 pass / 2 skipped** (the 2 skips are the same documented WebKit Tab-skips-anchors quirk).

Changes:

- **Premium prev/next navigation** — `PreviousNextLessonNavigation` is now one connected rounded card: two fully-tappable halves (`← DAN 135` / `DAN 137 →` with direction arrows + serif title beneath), a hairline divider between them, graceful disabled edges ("Početak kursa" / "Kraj kursa"). Stays one row down to 360px, stacks below that.
- **Upcoming-lesson state** — added `Lesson.isPlaceholder` (set by `_buildStubs.ts`; the validator now skips dropcap checks via the flag instead of a string match). `LessonReader` renders a calm centred "upcoming" card for placeholder lessons instead of the body — **the awkward giant drop-cap "L" is gone** — and the `Označi kao završeno` button is hidden so unavailable lessons can't be completed.
- **Mobile header** — `TopBar` progress group gets an "Ukupno" label (desktop only), tabular nowrap count promoted to `--ink-2`, `flex-shrink: 0`; tightened `--inner` / nav gaps at 720/560/460px; decorative mini-bar drops below 460px (precise count stays). `Brand` shrinks (mark 24px, name 16px) ≤560px.
- **Branding consistency** — `Brand` is now just **"History 365"** (the `/ Istorija 365` flourish removed). Product brand vs. course title ("Istorija Srbije 365", still rendered from `course.title`) no longer mixed in the header.
- **Epoch cards** — `CourseCard` progress count + "u toku" chip wrapped in a `space-between` row so the chip never stretches full-width on mobile; count promoted to `--ink-2`; consistent mobile padding; era title eased to 19px ≤720px.
- **Contents drawer** — removed the duplicate close button (`CourseSidebar` no longer renders its own / no longer takes `onClose`; the `MobileLessonDrawer` `data-drawer-close` button is the single close action). Lesson rows get more breathing room (row padding 8→10px, list gap 2→3px).
- **Typography scale** — added `mobile` overrides (≤860px) for `display`, `h1`, `h2`, `readerH2`, `lede` so the serif headings no longer over-set on narrow screens; `@learn365/ui` rebuilt.
- **Vertical spacing** — mobile media queries on Home / Course-overview / era-list tighten oversized section gaps so the current-lesson card and content surface earlier; `LessonReader` mobile bottom padding reduced.
- **e2e** — "completion persists across reload" retargeted from a placeholder day to authored day 7; added a test asserting the placeholder lesson shows the upcoming state and exposes no completion button.

Files touched: `packages/content/src/types.ts`, `.../lessons/_buildStubs.ts`, `.../validate.ts`; `packages/ui/src/tokens/typography.ts` (+ regenerated `dist/globals.css`); `packages/ui-web/src/{lesson/PreviousNextLessonNavigation,lesson/LessonReader,primitives/TopBar,primitives/Brand,course/CourseCard,course/CourseSidebar,course/LessonNavItem,course/SectionAccordion}`; `apps/web/app/page.module.css`, `apps/web/app/course/[courseId]/page.module.css`, `.../_components/CourseOverviewEras.module.css`, `.../lesson/[lessonId]/LessonPageClient.tsx`, `apps/web/e2e/smoke.spec.ts`.

## Phase 6.2 — Course page epoch hierarchy: done

Focused UX refinement on the Course overview — no data model, routing, progress, or numbering changes. Each epoch's description + section list now read as **child content** of the `CourseCard` above them: they're wrapped in a single `.eraChildren` container, indented, with a faint `--rule` left-border guide (an editorial hairline, not a heavy timeline rail). Desktop/tablet indent is `--space-3` margin + `--space-6` padding; mobile (≤720px) drops the margin and uses a `--space-4` padding so reading width is preserved. Engineering gates green: typecheck, lint, production build.

Files touched: `apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx` (wrapped description + section `<ul>` in a `.eraChildren` div), `.../CourseOverviewEras.module.css` (new `.eraChildren` rule + mobile override).

## Phase 6.3 — Course page nested accordion: done

A second UX refinement on the Course overview, deepening the three-tier hierarchy **epoch → lesson group → daily lesson**. No data model, routing, numbering, or progress changes — the daily lessons are read via the existing `getLessonsBySection` registry helper and their state via the existing `isCompleted` / `lastOpenedLessonId` selectors.

Changes (all in `CourseOverviewEras.tsx` + its module CSS):

- **Lesson groups are now accordion rows.** Each section row became a full-width `<button>` header (`aria-expanded` + `aria-controls`) with a subtle rotating `IconChev`. Collapsed by default. Single-open: at most one group is expanded at a time (`openSectionId` state), which keeps the page scannable on mobile and desktop — the 365 lessons are never all shown at once.
- **Expanded daily lessons are visually tertiary.** When a group opens it renders an inline `<ol>` of reused `LessonNavItem`s (day number `D031` + serif title + reading time + completion dot). They are indented a step beyond the group row (`--space-7`, `--space-4` on mobile) and use the lighter `LessonNavItem` type scale, so they never rival the group title or the epoch card. Active/completed state comes straight from the progress store; the last-opened lesson highlights as `active`.
- **Clearer nesting.** `.eraChildren` indentation deepened (`margin-left` `--space-3 → --space-4`, `padding-left` `--space-6 → --space-7`) while keeping the single faint `--rule` left guide line. The day-range moved from a left-hand grid column to a small mono label stacked above the section title — this reads as an editorial eyebrow and removes the fragile `≤560px` grid-reflow rules.
- **Identity preserved** — transparent rows, hairline `--rule` dividers, `--surface-2` hover, no shadows, serif titles, calm chevron rotation that collapses under `prefers-reduced-motion`.

Engineering gates green: `@learn365/web` typecheck, lint, and full `build` (5 routes, static + dynamic) all pass.

Files touched: `apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx`, `.../CourseOverviewEras.module.css`.

## Phase 6.4 — Home page premium polish: done

A focused refinement pass on the **Home page only** — mobile-first, calm beige/cream identity, serif editorial type, and the epoch cards / course-overview section all preserved. No data model, routing, or progress changes. Engineering gates green: `@learn365/web` typecheck, lint, full production build, and Playwright **7 tests × 5 profiles = 35 runs, 33 pass / 2 skipped** (the 2 skips are the documented WebKit Tab-skips-anchors quirk).

Changes:

- **Atmospheric hero backdrop.** The hero is now a full-shell-width band with a `.heroBackdrop` layer behind the content (`.heroInner`, capped to 760px). Layer stack (bottom→top): a pure-CSS parchment wash → `.heroBackdrop::before` image layer → `.heroBackdrop::after` cream readability overlay → content. The whole layer is masked (`mask-image` linear-gradient) so it fades in at the top and dissolves into the plain beige below — hero-only, nothing bleeds into the sections under it. **Swap seam:** the `::before` layer reads `background-image: var(--hero-image)`; the asset is set on one line in `page.module.css` (`url('/hero/hero-bg.webp')`, or `none` to fall back to the pure-CSS wash). The image layer is washed out (`opacity: 0.88`, `mix-blend-mode: multiply` over the cream bg) and the `::after` overlay guarantees hero text contrast.
- **Hero image asset.** `apps/web/public/hero/hero-bg.webp` — a soft sepia historical illustration (castle, Orthodox church, hills, mandala/icon corner detail), converted from the supplied PNG and resized to 1448px-wide WebP (~44 KB). `background-position: center 20%` on desktop keeps the calm misty upper band behind the text; a `≤720px` override shifts to `82% center` + `opacity: 0.95` because `cover` otherwise crops the narrow viewport to the empty centre — the override anchors the church/hillside instead.
- **State-aware hero CTA.** New client island `app/_components/HomeHeroCta.tsx`: "Započni kurs" → first lesson when there's no progress, "Nastavi lekciju" → last-opened lesson when there is. Supporting metadata stays course-level ("365 lekcija · oko 8 min dnevno") in both states so it never duplicates the lesson card below. Replaces the static "Pregled kursa →" link.
- **Hero copy.** Eyebrow "Premium · Istorijski" → "Dnevni kurs istorije". Description is now a Home-only page-level string (warmer, more editorial) instead of the shared factual `course.description` — the course-overview copy is untouched. Era-section intro reworded to be less technical.
- **Lesson card purpose clarified.** `HomeCurrentLessonCard` now renders a state-aware `Eyebrow` label above the card — "Preporučeno za početak" (idle) / "Nastavi gde si stao" (active) / "Nedavno završeno" (done) — so the card's role (continue / recommended start) is explicit and no longer reads as conflicting with the header's completed-count progress.
- **Brand mark.** `Brand` monogram changed from an outlined circle with an italic "H" to a solid historical-green disc with a cream serif "H", matching `app/icon.svg` so the brand reads consistently across tab + header. Minimal, not heavier.
- **Progress capsule.** `TopBar` progress group is now a calm pill micro-badge (hairline `--rule` border, soft `--surface` fill, `--r-pill`) instead of a border-left-divided cluster — reads as a deliberate marker of the 365-day journey.
- **e2e** — "home renders hero + CTA" assertion retargeted from "Pregled kursa" to "Započni kurs" (fresh sessions have no progress).

Files touched: `apps/web/app/page.tsx`, `apps/web/app/page.module.css`, `apps/web/app/_components/HomeHeroCta.tsx` (new), `apps/web/app/_components/HomeCurrentLessonCard.tsx`, `apps/web/e2e/smoke.spec.ts`; `packages/ui-web/src/primitives/Brand/Brand.module.css`, `packages/ui-web/src/primitives/TopBar/TopBar.module.css`.

## Phase 6.5 — Clarity & Differentiation: done

A UX clarity pass triggered by a review of the live mobile build. Goal: take the app from "very good" to "feels inevitable" — remove placeholder-looking cosmetics, give Home and Course overview distinct jobs, fix a progress-state contradiction, and make 365 lessons feel navigable. No data model or routing changes except the era year-label content fix. Mobile-first, Editorial identity preserved. Engineering gates all green: typecheck, lint, **64 unit tests** (content 24 / core 27 / ui-web 13), production build (5 routes), `validate-content` (365/28/8), and Playwright **8 tests × 5 profiles = 40 runs, 38 pass / 2 skipped** (the 2 skips are the documented WebKit Tab-skips-anchors quirk).

**Decisions locked (2026-05-14, with the product owner):** (1) Home = visual, Course = functional; (2) continue-state is completion-driven, not opened-driven; (3) jump-to-day is in scope; (4) whole pass runs, single review at the end.

Changes:

- **Tier 1 — Quick clarity wins**
  - **Count formatting fixed.** `String(n).padStart(3, '0')` removed from `CourseCard`, `TopBar`, `CourseProgress`, and `CourseSidebar` — quantities now read `0 / 30`, not `000 / 30`. Zero-padding stays only on `DAN nnn` / `Dnnn` *identifiers*.
  - **Section count labelled.** Course-overview section rows show `10 lekcija` instead of a bare `10`, via a `lessonCountLabel` helper in `CourseOverviewEras` with correct Serbian plural agreement (1/5+ → "lekcija", 2–4 → "lekcije").
  - **Era-card progress re-integrated.** In `CourseCard` the count + "u toku" chip now sit *above* the thin progress bar (the bar reads as a quiet underline reinforcing the count, no longer as an orphaned hairline below it).
  - **Year labels normalized.** `eras.ts` `yearsLabel` values use a tight en-dash and no trailing periods (`do 1166`, `1166–1371`, …, `1991–danas`); the `Era.yearsLabel` doc comment in `types.ts` updated to match. No validator/test asserted the old format.
  - **Empty-state ring softened.** `CourseProgress` renders a `0%` ring value in `--faint` weight-300 (`.ringValueZero`) so a fresh user isn't greeted by a bold, deflating score.
- **Tier 2 — Home vs Course differentiation**
  - **Home is now visual.** `HomeErasList` (a duplicate of the Course-overview `CourseCard` tree) is **deleted**; the new `HomeEraTimeline` client island renders the 8 eras via the existing `HistoricalTimeline` band — a visual taste of the journey, marker at the user's last-opened position, bands linking into each era. Home keeps exactly one recommended/continue card + one hero CTA.
  - **Course overview reads as a tool.** Header trimmed — the poetic `course.subtitle` lede (a duplicate of Home's hero copy) is dropped; the header is now eyebrow + title + a single "start from the beginning" action + the jump-to-day navigator. The full era→section→lesson accordion is now the *only* place that tree lives.
- **Tier 3 — Continue-state = completion-driven**
  - `HomeHeroCta`, `HomeCurrentLessonCard`, and `CourseOverviewProgress` now key the idle/continue distinction off `completedCount > 0`, not `lastOpenedLessonId`. Merely opening or peeking a lesson no longer flips the app into "continue" mode — so a `0 / 365` counter never sits next to a "Nastavi" label again. `lastOpenedLessonId` still supplies the genuine continue *target* once unlocked. `CourseProgress` gained a `hasStarted` prop: a fresh user's row reads "ZA POČETAK" with an idle dot instead of "AKTUELNO" with an active dot.
- **Tier 4 — Jump-to-day**
  - New `JumpToDay` component in `@learn365/ui-web` (`src/course/JumpToDay/`) — a validated 1–365 numeric input that routes straight to that day's lesson. Owns the day→route mapping internally (via the `@learn365/content` registry) so it takes only a `courseId` and works from server components. Full a11y: associated `<label>`, `aria-invalid` + `aria-describedby` wired to an inline `role="alert"` out-of-range error, native number spinners removed, Enter submits. Placed in the `CourseSidebar` header (desktop + mobile drawer) and the Course-overview header.

Files touched — `packages/ui-web/src/course/{CourseCard/CourseCard.tsx,CourseProgress/CourseProgress.tsx,CourseProgress/CourseProgress.module.css,CourseSidebar/CourseSidebar.tsx,index.ts}`, `packages/ui-web/src/course/JumpToDay/{JumpToDay.tsx,JumpToDay.module.css,index.ts}` (new), `packages/ui-web/src/primitives/TopBar/TopBar.tsx`; `packages/content/src/courses/istorija-srbije-365/eras.ts`, `packages/content/src/types.ts`; `apps/web/app/page.tsx`, `apps/web/app/page.module.css`, `apps/web/app/_components/HomeEraTimeline.tsx` (new), `apps/web/app/_components/HomeHeroCta.tsx`, `apps/web/app/_components/HomeCurrentLessonCard.tsx`, `apps/web/app/_components/HomeErasList.tsx` (deleted), `apps/web/app/course/[courseId]/page.tsx`, `.../page.module.css`, `.../_components/CourseOverviewEras.tsx`, `.../_components/CourseOverviewProgress.tsx`, `apps/web/e2e/smoke.spec.ts`.

## Phase 6.6 — Historical timeline v2 ("journey rail"): done

A focused redesign of the shared `HistoricalTimeline` component, triggered by a review of the live build: on mobile it was a cramped horizontal-scroll strip (only ~2.5 of 8 eras visible, titles truncated), and on every viewport it read as decorative — 8 identical boxes carrying no information. The v2 makes it *informative* and *responsive*. It is the shared component, so this lifted both Home and the lesson reader. Engineering gates all green: typecheck, lint, **79 unit tests** (ui 7 / ui-web 21 / core 27 / content 24 — `timelineMath` grew 7 → 15 tests), production build (5 routes), `validate-content` (365/28/8), Playwright **8 tests × 5 profiles = 40 runs, 38 pass / 2 skipped** (the documented WebKit Tab quirk).

**Decision (2026-05-14, with the product owner): full "journey-rail v2"** — all six moves plus a vertical mobile layout.

Changes:

- **Proportional band widths.** Band width tracks the era's lesson count (eras span 20–75 lessons) via `flex: var(--weight)` with a `min-width: 64px` legibility floor — the timeline now shows the actual shape of the course instead of 8 equal boxes.
- **Progress fill on the rail.** On desktop the rail fills with `--completed` from the start (`timelineFillPercent` = completed lessons / total). On mobile each era's rail *segment* is filled when that era is complete — coarser, but it reads at a glance in the vertical layout.
- **Era "station" states.** `completed` / `current` / `upcoming`, computed in the component from `eraStats`. Desktop shows state through numeral colour; mobile gives each era a node on the rail (`--completed` filled / `--accent` filled with a soft ring / hollow `--rule`).
- **Serif Roman numerals.** The era numerals moved from muted mono to Spectral serif — more historical, on-brand.
- **Panel container.** The whole timeline sits on a faint `--surface` panel with a hairline + `--r-lg` corners, so it reads as a deliberate object rather than loose lines on the page.
- **Refined marker + hover.** The marker is now a precise filled `--accent` dot with a layered hairline ring (`--surface` then `--rule-2`); desktop band hover gets a calm `--surface-2` wash.

**Layout** — one DOM, a `≤720px` media query swaps the axis. Desktop: a horizontal rail above proportional bands, with the fill and a year-interpolated marker. Mobile: a vertical journey rail at the left with 8 full-width era rows — all visible, no horizontal scroll, full era titles, and the full `yearsLabel` range (desktop shows just the start year). The free-floating marker is desktop-only (`.rail` is `display:none` on mobile); the current era's node stands in for it.

**Component API** — `HistoricalTimeline` gained one optional prop, `eraStats?: ReadonlyMap<EraId, EraStat>` where `EraStat = { lessonCount; completedCount }` (exported from `@learn365/ui-web`). Optional + backward-compatible: omitted → equal-width bands, no progress styling, marker still shows. Both call sites supply it — `HomeEraTimeline` builds it via `getLessonsByEra` + `progressForLessons`; `LessonPageClient` derives it from its already-loaded lessons + progress set and passes it through a new optional `LessonReader` `eraStats` prop.

**`timelineMath.ts`** gained `bandWeightPercents(weights)`, a `weights?`-aware `markerPositionPercent` (equal-width stays the default, so the original tests are untouched), and `timelineFillPercent(stats)` — 8 new unit tests cover them. The reduced-motion e2e assertion switched from `toBeVisible()` to `toBeAttached()` on the marker, since the marker is now `display:none` on the mobile layout but its collapsed transition is still assertable via `getComputedStyle`.

Files touched: `packages/ui-web/src/lesson/HistoricalTimeline/{HistoricalTimeline.tsx,HistoricalTimeline.module.css,timelineMath.ts,timelineMath.test.ts}`, `packages/ui-web/src/lesson/{index.ts,LessonReader/LessonReader.tsx}`; `apps/web/app/_components/HomeEraTimeline.tsx`, `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx`, `apps/web/e2e/smoke.spec.ts`.

## Phase 6.7 — Mobile lesson reading: compact context header: done

A focused UX pass on the lesson reader, triggered by a review of the live mobile build: the full `HistoricalTimeline` rendered inline between the breadcrumbs and the lesson header, so on phones a vertical 8-row block pushed the lesson title far down — the page read as a navigation screen, not a reading view. The lesson page is primarily for reading; the timeline is context, so it should be available but not dominate the first screen. Plan in `docs/PHASE_6_7_MOBILE_LESSON_CONTEXT.md`. Engineering gates all green: typecheck, lint, **79 unit tests**, production build (5 routes), `validate-content` (365/28/8), and Playwright **8 tests × 5 profiles = 40 runs, 38 pass / 2 skipped** (the 2 skips are the documented WebKit Tab-skips-anchors quirk).

**Decisions (2026-05-15, with the product owner):** (1) the mobile "Sadržaj" drawer holds **both** a compact timeline + the course outline — one unified navigation surface; (2) the swap is tied to the **layout** breakpoint (≤1024px, single column), not the device — single column ⇒ compact header + drawer, two-column desktop ⇒ unchanged.

Changes:

- **Inline timeline is desktop-only.** `LessonReader` wraps `<HistoricalTimeline>` in a `.timelineInline` div that is `display:none` at ≤1024px — which also drops it from the a11y tree, so there is no duplicate `nav` landmark. Desktop (>1024px) is visually unchanged: left `CourseSidebar` column + the inline horizontal journey rail.
- **New `LessonContextHeader`** (`apps/web`, colocated with the lesson route — consistent with the Phase 4 precedent of keeping the mobile course-outline trigger in the lesson page). Replaces the old thin `.mobileBar`. A calm two-row sticky bar shown only ≤1024px: row 1 — back link (→ course overview) · `DAN 001 / 365` · "Sadržaj" button; row 2 — current era label · thin `ProgressBar` + `1 / 365`. On ≤380px the back link collapses to a bare chevron.
- **Lesson title surfaces immediately.** With the inline timeline gone on mobile, `LessonHeader` (title + subtitle) now sits right after the breadcrumbs — the reading experience starts on the first screen.
- **Eyebrow de-duplicated.** `LessonHeader`'s eyebrow was one joined string; it's now split so the leading `DAN nnn · era` group (`.eyebrowContext`) is `display:none` at ≤1024px — the sticky context header already carries those. Reading time + year stay (the context header doesn't show them).
- **"Sadržaj" drawer = compact timeline + course outline.** `MobileLessonDrawer` children went from a bare `<CourseSidebar>` to a `.drawerContents` flex column: a `VREMENSKA OSA`-kickered compact `HistoricalTimeline` pinned at the top (bounded to `38vh`, scrolls), with the scrollable `CourseSidebar` outline filling the rest. Drawer `ariaLabel` default updated to "Sadržaj i vremenska osa".
- **`HistoricalTimeline` gained `variant?: 'full' | 'compact'`** (default `'full'`, backward-compatible — `HomeEraTimeline` and the desktop reader are untouched). `'compact'` forces the condensed vertical journey-rail layout at *every* viewport (the drawer is ~360px wide but can be open up to 1024px, so it can't rely on the `≤720px` media query) with lighter chrome — it already sits on the drawer surface.
- **e2e** — the "lesson reader shows day, sidebar, timeline" test is now layout-aware: on single-column profiles it opens the "Sadržaj" drawer, asserts the timeline is visible, then closes it; on desktop it asserts the inline timeline directly.

Files touched — `packages/ui-web/src/lesson/{LessonReader/LessonReader.tsx,LessonReader/LessonReader.module.css,LessonHeader/LessonHeader.tsx,LessonHeader/LessonHeader.module.css,HistoricalTimeline/HistoricalTimeline.tsx,HistoricalTimeline/HistoricalTimeline.module.css,MobileLessonDrawer/MobileLessonDrawer.tsx}`; `apps/web/app/course/[courseId]/lesson/[lessonId]/{LessonContextHeader.tsx,LessonContextHeader.module.css}` (new), `.../LessonPageClient.tsx`, `.../LessonPageClient.module.css`; `apps/web/e2e/smoke.spec.ts`; `docs/PHASE_6_7_MOBILE_LESSON_CONTEXT.md` (new).

## Phase 6.8 — Decluttering & navigation polish: done

Driven by the 2026-05-15 UX review (`docs/UX_REVIEW_2026-05-15.md`) and its
implementation plan (`docs/PHASE_6_8_DECLUTTER_PLAN.md`). All 5 review bundles
landed: 6.8a+b (sidebar & drawer declutter), 6.8c (article left-anchor),
6.8d+e (breadcrumbs link + sidebar tree shows where you are), 6.8f+g (hero
tighten + day-label normalise + placeholder signal), 6.8h (Era I content fix).

### Phase 6.8h — Era I rename + widen: done

Resolves the contradiction the UX review flagged: Era I previously titled
*"Doseljavanje Slovena i rani srednji vek"* with `yearStart: 600` contained
the Lepenski Vir lesson at 9500 BCE, so its breadcrumb / eyebrow / timeline
marker were all labelled with the wrong era. Era I is now widened (option
*a* from the plan):

- `title`: *"Od praistorije do ranog srednjeg veka"*
- `description`: rewritten to span Lepenski Vir → Vinčanska → Illyrian /
  Roman heritage → Slavic settlement → early principalities (the actual arc
  of sections 1–3).
- `yearStart`: `600 → -9500` (covers Lepenski Vir's ~7000 BCE end of the
  Lepenski Vir cultural range — timeline math now interpolates the marker
  inside the era's actual span instead of clamping to the era's left edge).
- `yearsLabel`: `"do 1166" → "praistorija – 1166"`.
- `eraShort`: `"Rani srednji vek" → "Praistorija i rani srednji vek"`.
- `id` is **retained** as `rani-srednji-vek` — every section + authored
  lesson references it; renaming would cascade through the content registry,
  the URL slugs aren't affected by the id, and progress state keyed by
  lesson ids stays valid.

`HistoricalTimeline` gained a small `formatYearShort` helper so negative
`yearStart` values render as `"9500 p.n.e."` on the desktop rail instead of
the raw `"-9500"`. Backward-compatible: positive years still render bare
(unchanged).

Validator unaffected — rule 6 requires `yearStart < yearEnd` and monotonic
ordering, both hold: `-9500 < 1166` and `-9500 < 1166` (Era II's
`yearStart`). 365/28/8 still green.

Engineering gates all green: typecheck (6 packages), lint, **79 unit tests**
(content 24 / core 27 / ui-web 21 / ui 7), production build (5 routes;
lesson route bundle unchanged at 1.82 kB), `validate-content` (365/28/8),
Playwright **38 / 40** (the 2 documented WebKit skips).

Files touched: `packages/content/src/courses/istorija-srbije-365/eras.ts`,
`packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.tsx`.

### Phase 6.8f + 6.8g — Hero tighten, day-label normalise, placeholder signal: done

### Phase 6.8f + 6.8g — Hero tighten, day-label normalise, placeholder signal: done

**6.8f** — The Home hero stopped introducing the course twice. The duplicate
`course.subtitle` lede was removed; only the warmer, Home-specific
`HERO_DESCRIPTION` paragraph remains between the display title and the CTA.
Day-label format normalised: the lesson-page breadcrumb's final crumb went
from `Dan 001` to `DAN 001` to match the LessonContextHeader, LessonHeader
eyebrow, and CourseProgress "DAN nnn" identifier convention. The
defensive-only "day not found" error in `JumpToDay` also normalised to
`DAN nnn` for consistency. The compact `D001` style in `LessonNavItem` and
`SectionAccordion` ranges stays — that's the deliberate tabular form.

**6.8g** — Placeholder lessons (the 359 unauthored stubs) are now visibly
*upcoming* in every sidebar / accordion / course-overview tree. `LessonNavItem`
inspects `lesson.isPlaceholder`; when true the row's `day`, `title`, and
`meta` text drop to `var(--faint)` and the title goes italic. The
`.placeholder` rules sit after the `.state_*` blocks so they win at equal
specificity for both idle and active placeholder rows — a placeholder lesson
the user is sitting on still gets the accent-soft backdrop ("where am I"),
with the dimmed text inside making the unavailability clear. No new props on
`SectionAccordion` or `CourseOverviewEras` — the flag is read off the
already-passed `lesson` object.

Engineering gates all green: typecheck (6 packages), lint, **79 unit tests**,
production build (5 routes, sizes unchanged from 6.8e), `validate-content`
(365/28/8), Playwright **38 / 40** (the 2 documented WebKit skips).

Files touched: `apps/web/app/page.tsx`,
`apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx`;
`packages/ui-web/src/course/{JumpToDay/JumpToDay.tsx,LessonNavItem/LessonNavItem.tsx,LessonNavItem/LessonNavItem.module.css}`.

### Phase 6.8d + 6.8e — Breadcrumbs link, sidebar tree shows where you are: done

**6.8d** — `BreadcrumbItem` gained an optional `href?: string`. Render order
is now: `href` → `<Link>` (`next/link`), `onClick` → `<button>`, neither →
`<span>`. The last crumb always renders as a non-interactive span with
`aria-current="page"`, regardless of `href` / `onClick`. The lesson page's
breadcrumbs (`Početna` / course title / era title / Dan nnn) now actually
navigate: Početna → `/`, course → `/course/[id]`, era → era's first lesson;
the final `Dan nnn` stays a span. Hover gets a subtle underline.
`docs/COMPONENT_LIBRARY.md` updated — this closes the open Phase-3
`onClick → href` revision item.

**6.8e** — `EraGroup` is now an accordion. Mirroring the `SectionAccordion`
pattern, the era header is a button with a chevron + `aria-expanded` +
`aria-controls`; the era's section list mounts only when open. `CourseSidebar`
gained `openEraIds` + `onToggleEra` props (same shape as the existing
`openSectionIds` / `onToggleSection`). `LessonPageClient` tracks `openEraIds`
state (default = `new Set([currentEraId])`) and auto-expands the current
era when the user navigates across eras — mirror of the existing per-section
auto-expand. The user now lands on "where am I" rather than the full 8-era
/ 28-section wall.

Engineering gates all green: typecheck (6 packages), lint, **79 unit tests**,
production build (5 routes; lesson route bundle 1.76 kB → 1.82 kB with the
added accordion state + breadcrumb hrefs), `validate-content` (365/28/8),
Playwright **38 / 40** (the 2 documented WebKit skips).

Files touched: `packages/ui-web/src/primitives/Breadcrumbs/{Breadcrumbs.tsx,Breadcrumbs.module.css}`,
`packages/ui-web/src/course/EraGroup/{EraGroup.tsx,EraGroup.module.css}`,
`packages/ui-web/src/course/CourseSidebar/CourseSidebar.tsx`;
`apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx`;
`docs/COMPONENT_LIBRARY.md`.

### Phase 6.8c — Article left-anchored against the sidebar: done

On the desktop two-column layout (>1024px), the lesson article is no longer
centred inside an oversized reader column — `.reader { margin: 0 }` anchors
it flush-left against the `CourseSidebar`, with the right side carrying the
breathing room. The 660px reading measure (`var(--reading-col)`) is unchanged,
so the line length stays correct. Single-column layouts (≤1024px) restore
`margin: 0 auto` so the column remains balanced when there is no sidebar to
anchor against. Pure CSS change to one file. Engineering gates all green:
typecheck, lint, **79 unit tests**, production build (5 routes, sizes
unchanged), Playwright **38 / 40** (the 2 documented WebKit skips).

Files touched: `packages/ui-web/src/lesson/LessonReader/LessonReader.module.css`.

### Phase 6.8a + 6.8b — Sidebar & drawer declutter: done

The lesson sidebar header collapsed from four stacked widgets to two:
`KURS` kicker + course title. The duplicate `ProgressBar` (the TopBar capsule
is the canonical course-progress indicator) and the inline `JumpToDay` form
were removed — fast-jump still lives on the Course overview page. The mobile
"Sadržaj" drawer's pinned `VREMENSKA OSA` compact-timeline panel and its
kicker were removed; the drawer now renders a single `<CourseSidebar>` and
nothing else. `MobileLessonDrawer`'s default `ariaLabel` reverted to
`"Sadržaj kursa"`; `LessonContextHeader`'s contents-button `aria-label`
tightened to `"Otvori sadržaj"`. The Playwright "lesson reader shows day…"
test now asserts the drawer dialog opens/closes on single-column profiles
(role=dialog, name="Sadržaj kursa") instead of asserting the now-absent
drawer timeline.

Engineering gates all green: typecheck (6 packages), lint, **79 unit tests**
(content 24 / core 27 / ui-web 21 / ui 7), production build (5 routes, lesson
route bundle shrank slightly with the dropped imports), `validate-content`
(365/28/8), Playwright **8 tests × 5 profiles = 40 runs, 38 pass / 2 skipped**
(the documented WebKit Tab-skips-anchors quirk).

Files touched: `packages/ui-web/src/course/CourseSidebar/{CourseSidebar.tsx,CourseSidebar.module.css}`,
`packages/ui-web/src/lesson/MobileLessonDrawer/MobileLessonDrawer.tsx`;
`apps/web/app/course/[courseId]/lesson/[lessonId]/{LessonPageClient.tsx,LessonPageClient.module.css,LessonContextHeader.tsx}`,
`apps/web/e2e/smoke.spec.ts`.

## Next step

Outstanding work — none of it blocks the live site, but it was deferred, not done:

- **Screen-reader smoke** — VoiceOver / NVDA on TopBar nav + breadcrumbs + accordion + completion toggle.
- **Editorial review of the 6 authored seed lessons** (`packages/content/src/courses/istorija-srbije-365/lessons/authored/`) for historical voice, accuracy, period coverage.
- `COMPONENT_LIBRARY.md` still needs the `onClick → href` revision for navigation props called out at the end of Phase 3.

After these, the roadmap continues with Phase 7 (Mobile / Expo) and Phase 8 (Backend / .NET) per `docs/IMPLEMENTATION_PLAN.md`.
