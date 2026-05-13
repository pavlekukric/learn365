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

## Next step

Engineering side of Phase 5 is closed. Remaining gates before Phase 6 are content/accessibility audit, not code:

- VoiceOver / NVDA screen-reader smoke on TopBar nav + breadcrumbs + accordion + completion toggle.
- Editorial review of the 6 authored seed lessons (`packages/content/src/courses/istorija-srbije-365/lessons/authored/`) for historical voice, accuracy, period coverage.

Once those clear, **Phase 6 — Web release** (deploy). Open product decisions for that phase: hosting target (Vercel default vs. Azure Static Web Apps for tenant alignment with the planned Phase 8 .NET backend), domain registration, and whether to add an error-monitoring SDK (still excluded from v1 scope today, see §V1 exclusions).

`COMPONENT_LIBRARY.md` still needs the `onClick → href` revision for navigation props called out at the end of Phase 3.
