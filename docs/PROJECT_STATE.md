# Project State

## Current phase

**Phase 0 — repo bootstrap: in progress.** Documentation foundation is in place. Monorepo tooling (pnpm workspaces, Turborepo, base TS config, ESLint flat config, Prettier, CI) has been scaffolded. No application or package code yet — Phase 1 introduces `packages/content`, `packages/core`, and `packages/ui`.

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

- `package.json` (root, private, `packageManager: pnpm@9.15.0`, Node `>=20.10 <21`)
- `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `tooling/*`)
- `turbo.json` (tasks: `dev`, `build`, `typecheck`, `lint`, `test`, `validate-content`)
- `tsconfig.base.json` (TS strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, `moduleResolution: Bundler`)
- `.gitignore`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.npmrc`, `.nvmrc`

Tooling:

- `tooling/tsconfig/` — `@learn365/tsconfig` with `base.json`, `react-library.json`, `nextjs.json`, `node.json` presets
- `tooling/eslint-config/` — `@learn365/eslint-config` flat config: `@eslint/js` recommended + `typescript-eslint` strict & stylistic + architecture rule banning imports from `design/cloud-design-v1/`

CI:

- `.github/workflows/ci.yml` — runs on PRs and pushes to `main`; pnpm + Node via `.nvmrc`; `install → lint → typecheck → test → build → validate-content`

## Next step

1. Run `pnpm install` locally to generate `pnpm-lock.yaml` and commit it.
2. Confirm `pnpm lint`, `pnpm typecheck`, `pnpm build` all complete (turbo will report "no tasks" cleanly until Phase 1 adds them).
3. Begin **Phase 1 — content and core packages** per `docs/IMPLEMENTATION_PLAN.md` §10.
