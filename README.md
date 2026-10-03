# Istorija 365

Istorija 365 (formerly "History 365") is a premium daily learning app for Serbian history.

The goal is to help users learn Serbian history through 365 short, structured lessons. Each lesson takes 5–7 minutes to read (the range is derived from the texts, never promised by hand).

The app should feel like a premium educational product: calm, elegant, highly polished, and easy to use.

## Product direction

The first version focuses on:

- Serbian history course: `Istorija Srbije 365`
- 365 short lessons
- Lessons grouped into historical periods/chapters
- Premium Home page
- Course overview page
- Lesson reader page
- Desktop and mobile UX
- Collapsible lesson sidebar
- Green checkmark for completed lessons
- Clear active lesson state
- Progress indicator: `Pročitano 1 / 365`
- Historical timeline showing the current year/period
- Simple completion tracking

## Not included in v1

The first version should NOT include:

- Payment
- Subscription plans
- Social features
- Quizzes
- Comments
- Admin panel
- AI-generated content pipeline inside the app

These can be added later. Accounts (Google sign-in) and cloud progress left this list with Phase 8 (2026-09-27): Next.js route handlers + PostgreSQL inside `apps/web`; reading never requires an account.

## Main design inspiration

Navigation clarity should be similar to premium learning platforms such as Pluralsight.

Visual feeling should be closer to a premium historical/editorial reading experience:

- Warm
- Calm
- Elegant
- Scholarly
- Modern
- Not generic SaaS
- Not childish
- Not overly gamified

## Setup

Requirements: Node 22 (`.nvmrc`; `engines` allows ≥ 20.10) and pnpm 9.15 (`packageManager`; `corepack enable` picks it up).

```bash
pnpm install
pnpm dev                     # http://localhost:3000 — reading works with no account and no database
```

Accounts are off unless `apps/web/.env.local` sets all four of `DATABASE_URL`, `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (see `apps/web/.env.example`; locally the database is PGlite, nothing to install).

### Commands

| Command                                                     | What it does                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test` | Turborepo over every package (Vitest for `test`)                                                                                   |
| `pnpm validate-content`                                     | Checks `content/courses/istorija-srbije-365/` against the content rules                                                            |
| `pnpm gen-content`                                          | Regenerates the committed `_generated*.ts` modules from the JSON (CI fails if they are stale)                                      |
| `pnpm format` / `pnpm format:check`                         | Prettier (not yet enforced in CI)                                                                                                  |
| `pnpm screenshots`                                          | Builds and captures the screenshot pack (`screenshots/`)                                                                           |
| `pnpm --filter @learn365/web check-bundle`                  | Per-route JS budget (175 kB gzip) and the font-preload budget, after `pnpm build`                                                  |
| `pnpm --filter @learn365/web test:e2e`                      | Playwright, after `pnpm build` (CI runs `chromium-desktop`, `chromium-mobile`, `a11y-desktop`, `a11y-mobile`, `accounts-chromium`) |
| `pnpm --filter @learn365/web lighthouse`                    | Mobile Lighthouse on Home, the course and Day 1, warn-only, after `pnpm build`                                                     |

### Structure

```
apps/web/            Next.js 15 app: routes, API route handlers (accounts, sync), e2e
packages/content/    Course data loader, types, validator, generated registry
packages/core/       Progress + bookmark stores, navigation, day formatters (no React)
packages/ui/         Design tokens and themes
packages/ui-web/     React components (CSS Modules)
content/             The lesson JSON — the editable source
deploy/              Docker Compose, deploy and backup scripts for the VPS
design/              Cloud Design V1 reference (never imported)
tooling/             Shared ESLint and tsconfig presets
```

CI (`.github/workflows/`): `ci.yml` (validate + e2e on every PR and push to `main`), `deploy.yml` (after a green CI on `main`), `lighthouse.yml` (warn-only, on PRs and nightly), `e2e-nightly.yml` (Firefox + WebKit).

## Documentation

Start here, in order:

- [HANDOFF.md](HANDOFF.md) — what is true now and what to do next. Read this before starting any new work.
- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — current baseline (do not regress below this) + the newest phase entries; Phases 0–16 are in `docs/archive/PROJECT_STATE_PHASE_LOG.md`.
- [docs/PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) — product idea, target user, scope.
- [docs/UX_REQUIREMENTS.md](docs/UX_REQUIREMENTS.md) — IA, screen layouts, interaction patterns.
- [docs/CONTENT_MODEL.md](docs/CONTENT_MODEL.md) — canonical content contract (entity shapes for `Course`, `Era`, `Section`, `Lesson`).
- [docs/CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md) — how to write and ship a lesson.
- [docs/AGENTS.md](docs/AGENTS.md) — Claude agent roles, decision gates, code-review expectations.
- [docs/APP_ARCHITECTURE.md](docs/APP_ARCHITECTURE.md) and [docs/COMPONENT_LIBRARY.md](docs/COMPONENT_LIBRARY.md) — packages, dependency rules, data flow, components.
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — tokens and type; the original design prompt is [docs/archive/CLOUD_DESIGN_PROMPT.md](docs/archive/CLOUD_DESIGN_PROMPT.md) (history only).
- [docs/DEPLOY.md](docs/DEPLOY.md) — production (Docker on the VPS, CI-gated deploy).

Completed phase plans and superseded UX reviews live in [docs/archive/](docs/archive/) — kept for archaeology, **not** to inform new work.
