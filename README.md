# History 365 / Istorija 365

History 365 is a premium daily learning app for Serbian history.

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
- Progress indicator: `1 / 365 completed`
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

## Documentation

Start here, in order:

- [HANDOFF.md](HANDOFF.md) — what is true now and what to do next. Read this before starting any new work.
- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — current baseline (do not regress below this) + full phase history.
- [docs/PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) — product idea, target user, scope.
- [docs/UX_REQUIREMENTS.md](docs/UX_REQUIREMENTS.md) — IA, screen layouts, interaction patterns.
- [docs/CONTENT_MODEL.md](docs/CONTENT_MODEL.md) — canonical content contract (entity shapes for `Course`, `Era`, `Section`, `Lesson`).
- [docs/CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md) — how to write and ship a lesson.
- [docs/AGENTS.md](docs/AGENTS.md) — Claude agent roles, decision gates, code-review expectations.
- [docs/CLOUD_DESIGN_PROMPT.md](docs/CLOUD_DESIGN_PROMPT.md) — design system origin (historical reference).

Completed phase plans and superseded UX reviews live in [docs/archive/](docs/archive/) — kept for archaeology, **not** to inform new work.
