# Implementation Plan

Canonical implementation plan for the Learn365 repository.

This document is the source of truth for *what we are building, in what order, on which stack*. Update it as phases complete.

---

## 1. Naming and product framing

- **Repository / umbrella platform**: `Learn365`
- **Product brand for v1 UI**: `History 365` / `Istorija 365`
- **First course inside the product**: `Istorija Srbije 365`
- **Internal architecture**: generic `Course` / `Era` / `Section` / `Lesson` / `UserProgress` model

The v1 UI must feel focused on History 365 — not a generic learning marketplace. The Learn365 umbrella exists only at the repo / architecture level. No "Learn365" branding surfaces in v1 UI copy, navigation, or routes.

The architecture stays generic so that a second 365-day course (world history, geography, etc.) can be added later without product or routing changes.

---

## 2. Content hierarchy decision

**Adopted: `Course → Era → Section → Lesson`.**

Rationale:

- The 8 high-level eras span 600 → 2026 and are essential for chronological orientation. The historical timeline operates at the **Era** layer.
- Era lesson counts are highly uneven (20–75). Expanding an era directly into a flat list of 75 lessons makes the sidebar unusable.
- Sections (≈8–18 lessons each) are the practical sidebar accordion unit. They also give the editor a natural place to title a sub-arc ("Rani Nemanjići", "Dušanovo carstvo", "Albanska golgota").
- The historical timeline never shows Sections — it shows the 8 Eras only.

Entities:

| Entity | Purpose | Counts (v1) |
|---|---|---|
| `Course` | A full 365-day learning journey | 1 (`istorija-srbije-365`) |
| `Era` (a.k.a. HistoricalPeriod) | High-level chronological band shown on the timeline | 8 |
| `Section` (a.k.a. Chapter) | Sidebar accordion unit inside an Era | ~30–40 across the course |
| `Lesson` | One daily reading unit | 365 |
| `UserProgress` | Local completion state | per device, per course |

---

## 3. Approved design summary

Cloud Design V1 (in `design/cloud-design-v1/`) is the visual source of truth. v1 ships the **Editorial** direction only (warm cream parchment, evergreen accent, Spectral serif). The **Modern** direction stays in the repo as a future/dev-only reference and is **not exposed to users**.

Preserved qualities:

- Editorial serif typography (Spectral) for display/body, Inter for sans, JetBrains Mono for metadata.
- Warm cream parchment background, subtle hairline rules, evergreen accent.
- Dropcap on first paragraph; ornamental flourish dividers; blockquote with accent left rule.
- Sticky top bar with brand, nav, and a tiny progress chip.
- Sidebar with collapsible sections, accent left-bar on the active lesson, green checkmark on completed.
- Horizontal era timeline above the reader with smooth marker animation.
- Reading column capped at 660px; shell capped at 1440px.
- Compact mobile reader with sticky day strip + slide-in drawer.

---

## 4. Screens and routes

| Screen | Web route | Notes |
|---|---|---|
| Home | `/` | Hero, how-it-works, era preview, CTA |
| Course overview | `/course/[courseId]` | Course header, progress ring, era list (collapsible to sections) |
| Lesson reader | `/course/[courseId]/lesson/[lessonId]` | Sidebar + reader; mobile = drawer |

Mobile (planned, not yet implemented) mirrors the same structure under `expo-router`.

---

## 5. Component inventory

Primitives: `Brand`, `TopBar`, `Breadcrumbs`, `Button`, `Card`, `ProgressBar`, `ProgressRing`, `CompletionDot`, `Chip`, `Eyebrow`, `Flourish`, `Placeholder`, icons.

Course/lesson surfaces: `CourseCard`, `CourseProgress`, `CourseSidebar`, `EraGroup`, `SectionAccordion`, `LessonNavItem`, `HistoricalTimeline`, `LessonHeader`, `LessonReader`, `LessonBody`, `MarkAsCompletedButton`, `PreviousNextLessonNavigation`, `MobileLessonDrawer`, `CurrentLessonCard`.

Full contracts and states live in `docs/COMPONENT_LIBRARY.md`.

---

## 6. Tech stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript (strict) |
| Web framework | Next.js 15 (App Router) |
| Web styling | CSS Modules + global token CSS variables (no Tailwind) |
| Mobile framework | Expo SDK with `expo-router` *(planned, not implemented in phase 1)* |
| State | Zustand + `persist` middleware |
| Local storage | `localStorage` (web), `AsyncStorage` (mobile, later) |
| Content | TypeScript modules in v1; MDX migration path documented |
| Testing — web | Vitest (unit), Playwright (E2E + visual) |
| Testing — mobile | Jest + RNTL + Maestro (later) |
| Lint/format | ESLint flat config + Prettier |
| Fonts | `next/font` (web), `expo-font` (mobile, later) |

---

## 7. Monorepo layout

```
learn365/
├─ apps/
│  ├─ web/                        # Next.js 15 — only app in phase 1
│  └─ mobile/                     # Created in mobile phase, not before
├─ packages/
│  ├─ ui/                         # Tokens, themes, cross-platform contracts
│  ├─ ui-web/                     # React + CSS Modules components for web
│  ├─ ui-mobile/                  # Created in mobile phase
│  ├─ core/                       # ProgressStore, selectors, navigation logic
│  └─ content/                    # Course/era/section/lesson data
├─ tooling/                       # Shared ESLint, tsconfig presets
├─ design/cloud-design-v1/        # Visual reference, untouched
└─ docs/
```

Detailed boundaries in `docs/APP_ARCHITECTURE.md`.

---

## 8. Content / UI isolation

Content and UI are isolated. Lesson bodies live as structured data in `packages/content`, never inside React components.

- v1: TypeScript modules export `LessonBlock[]` arrays.
- v2 path: MDX or Markdown-with-frontmatter, parsed at build time into the same `LessonBlock[]` shape.
- React components consume `LessonBlock[]` via a `LessonBody` renderer; they never see raw text strings or import lesson modules directly.

Full authoring guide in `docs/CONTENT_AUTHORING.md`.

---

## 9. Progress / completion state

Single `ProgressStore` (Zustand) in `packages/core/progress`:

- Keys progress by `courseId` so multiple courses work later.
- Tracks `completedLessonIds: Set<LessonId>`, `lastOpenedLessonId`, `updatedAt`.
- Persists via a swappable storage adapter (`localStorage` on web, `AsyncStorage` on mobile).
- Store has zero React dependencies — fully unit-testable.

---

## 10. Phases

### Phase 0 — Repo bootstrap
pnpm workspaces, Turborepo, base TS configs, ESLint flat config, Prettier, CI skeleton. No app code.

### Phase 1 — Content and core packages
`packages/content` (types, 8 eras, ~30 sections, lesson stubs + 6 seed lessons fully written), `packages/core` (`ProgressStore`, storage adapter interface, prev/next helpers), `packages/ui` tokens + Editorial theme.

### Phase 2 — Web shell
Bootstrap Next.js app, fonts via `next/font`, `globals.css` from tokens, `TopBar`, route skeleton.

### Phase 3 — Web components
Build `packages/ui-web` — primitives first, then surfaces. Each component gets `.tsx` + `.module.css` + tests where logic warrants.

### Phase 4 — Web screens
Home, Course overview, Lesson reader. Wire `ProgressStore`. Mobile responsive behavior including drawer.

### Phase 5 — Web polish + QA
Keyboard nav, focus states, ARIA, reduced motion, Playwright E2E + visual snapshots, Lighthouse pass.

### Phase 6 — Web release
Deploy to Vercel. Procedure and project settings are canonical in [`docs/DEPLOY.md`](DEPLOY.md). Production deploy is gated on the Phase 5 manual gates (screen-reader smoke + editorial review of the 6 seed lessons).

### Phase 7+ — Mobile *(deferred until web v1 is visually approved)*
Expo bootstrap → `ui-mobile` components → screens → device QA → store submission.

### Phase 8 — Backend *(v2; starts after web v1 release; runs in parallel with mobile)*

.NET 9 Web API + SQL Server. Built only after web v1 ships. Sub-phases:

- **8a — API skeleton + identity**: .NET solution, EF Core, SQL Server connection, ASP.NET Identity, health endpoint.
- **8b — Auth endpoints**: register, login, refresh, logout with rotating refresh tokens.
- **8c — Progress endpoints**: `GET/PUT/DELETE /api/me/progress…` and `POST /api/me/progress/sync`.
- **8d — Client adapter swap**: `RemoteProgressStorage` in `@learn365/core`, sign-in screen in `apps/web`, local-to-cloud reconciliation on first sign-in.
- **8e — Production deploy + observability**: Azure App Service + Azure SQL, Serilog, backup/restore rehearsal.

Full design in `docs/BACKEND_STRATEGY.md`. Mobile (phase 7) can adopt the adapter in 8d; neither phase blocks the other.

---

## 11. Files to create (priority order)

Pre-Phase 0 (this commit set): every file in `docs/` listed in this plan.

Phase 0: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.editorconfig`, `.prettierrc`, `.gitignore`, `tooling/eslint-config`, `tooling/tsconfig`, `.github/workflows/ci.yml`.

Phase 1+ files are listed in `docs/APP_ARCHITECTURE.md`.

---

## 12. Build / test / typecheck strategy

| Task | Command |
|---|---|
| `dev` | `turbo run dev` |
| `build` | `turbo run build` |
| `typecheck` | `turbo run typecheck` (`tsc --noEmit`) |
| `lint` | `turbo run lint` |
| `test` | `turbo run test` |
| `test:e2e` | `pnpm --filter web test:e2e` |
| `validate-content` | `pnpm --filter content validate` |

CI runs install → lint → typecheck → test → build → validate-content → Playwright.

---

## 13. Open risks (live list)

- Cross-platform typography parity (Spectral on iOS/Android, dropcap behavior).
- OKLCH support on older Android WebViews — sRGB fallbacks for critical tokens.
- `localStorage` in private mode — UX copy will clearly state progress is per-device.
- Lesson content volume: 365 historically accurate lessons is an authoring effort independent of engineering.
- Era timeline assumes ≤ ~12 eras horizontally; documented as a design budget.
- Sidebar performance with 365 rows — only the expanded section renders its lessons; virtualize only if profiling demands.
- *(Phase 8)* Identity / auth scope creep — defaults locked to password + email verification; OAuth deferred to a later sub-phase.
- *(Phase 8)* Local-to-cloud progress reconciliation on first sign-in — completion is monotonic (union is safe), but stale local payloads must be size-capped server-side.
- *(Phase 5 / accepted)* Lighthouse mobile performance is 82–85 on `next start` (slow-4G + 4× CPU sim), below the ≥90 QA-checklist target. Root cause: 3 Google fonts (Spectral + Inter + JetBrains Mono) all preloaded; LCP gated on Spectral serif. Editorial typography is core to brand, so we accept the gap for v1. Mitigation if real-user metrics regress: self-host fonts + inline critical CSS, or system-fonts-first with progressive enhancement.

---

## 14. Status

| Phase | Status |
|---|---|
| Plan approved | done (with adjustments) |
| Documentation foundation (this set) | done |
| Phase 0 bootstrap | done — pending `pnpm install` and lockfile commit |
| Phase 1 content + core | done (Claude-authored seed lessons pending editorial review) |
| Phase 2 web shell | done — Next.js 15 app, fonts, TopBar, 3 routes, localStorage progress |
| Phase 3 web components | done — `@learn365/ui-web` with 6 icons, 12 primitives, 7 course surfaces, 7 lesson surfaces, 13 unit tests; `apps/web` consumes the package for TopBar |
| Phase 4 web screens | done — `/`, `/course/[courseId]`, `/course/[courseId]/lesson/[lessonId]` rewired to compose `@learn365/ui-web` with live progress; lesson page has desktop sticky sidebar + mobile drawer; SSR smoke-verified at HTTP 200 for all three routes |
| Phase 5 web polish + QA | done — skip link + `<main id="main-content">` landmark; focus-visible audit; drawer backdrop hardened (aria-hidden div + initial focus on close button); Playwright across 5 browser profiles (chromium/firefox/webkit desktop + chromium/webkit mobile), 6 tests × 5 = 28 pass / 2 documented WebKit skips; reduced-motion E2E assertion; Lighthouse desktop 99–100 on every category; mobile A11y/BP/SEO all 100, mobile performance 82–85 (gap to ≥90 accepted as a v1 risk, see §13). Lighthouse-driven fixes: contrast on active LessonNavItem row, WCAG Label-in-Name on Brand + Timeline links, favicon icon added, unused Inter 600 weight removed. Manual gates outstanding: VoiceOver/NVDA screen-reader smoke, editorial review of 6 seed lessons. |
| Phase 6 web release | done — live on Vercel at <https://learn365-web.vercel.app/> (project `learn365-web`, root `apps/web`, Node 20, no env vars, no `vercel.json`). Procedure canonical in `docs/DEPLOY.md`. The Phase 5 manual gates (screen-reader smoke + editorial review of 6 seed lessons) were overridden, not cleared — deliberate product call, tracked as open work in `docs/PROJECT_STATE.md`. |
