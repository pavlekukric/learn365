# Phase 9 — Corpus out of the client bundle + 366 prerendered pages (PLAN)

**Status:** Draft, awaiting owner sign-off on the locked decisions (§1).
**Date:** 2026-09-28
**Predecessors:** Review P0 closed (PRs #37, #38); Phase 8 live (PR #34, `06e6a55`).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P1 items 6 (corpus out of the client bundle) and 7 (prerender the 366 course/lesson pages); Performance 5/10; §5 "Measurements behind the scores".
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick, agreed with the owner 2026-09-28: review P1 items 6 + 7 as one planned phase."
- [`docs/APP_ARCHITECTURE.md`](./APP_ARCHITECTURE.md) §3 / §4 — package responsibilities and dependency rules this phase tightens.
- [`docs/CONTENT_MODEL.md`](./CONTENT_MODEL.md) — the `Lesson` contract, unchanged on disk by this phase.
- [`docs/archive/phases/PHASE_7_4_PLAN.md`](./archive/phases/PHASE_7_4_PLAN.md) — structure template.

## Why this is the next phase

Measured on the local production build of `main` (`d60d702`, `next build` of 2026-09-28; route sizes summed from `.next/app-build-manifest.json`, gzip at zlib default; index sizes computed from the JSON corpus):

| What | Today | After this phase (target) |
| --- | --- | --- |
| Client JS on `/privatnost` (a page with no lesson content) | 933 kB gzip | ≈ 105 kB gzip |
| Client JS on a lesson page | 945 kB gzip | ≈ 118 kB gzip |
| Chunk `138` (every lesson body, attached to `/layout`) | 2,357 kB raw / 824 kB gzip | gone |
| Navigation index the client actually needs (10 fields × 365 lessons) | — | 84 kB raw / 9.2 kB gzip |
| Prerendered course/lesson pages (`prerender-manifest.json`) | 0 of 366 — SSR per request | 366 of 366 |

Two root causes, both structural rather than bugs:

1. `packages/content` ships one generated module carrying every field of every lesson, and its registry (`getLessons`, `getLessonById`, …) is imported by client components on every surface (`useResumeLesson`, `HomeEraTimeline`, `CourseOverviewEras`, `LessonPageClient`, …) and by the providers in the root layout (`AuthProvider` and `CloudSync` call `getAllCourseIds`). So the 2.3 MB corpus sits in the layout's client graph and every route pays for it, `/privatnost` included. The lesson page then also passes the full `lesson` (with `content[]`) as a prop, so each body arrives a second time in the RSC payload and a third time in the HTML.
2. Neither dynamic route exports `generateStaticParams`, so all 366 pages are rendered per request on the 512 MB container. The pages are pure functions of the registry — progress hydrates from `localStorage`, the session from `/api/me`, both client-side — so there is nothing to compute per request.

Both fixes are mechanical and touch no visual surface. They land together because the split decides what the server page renders, and the prerender is a two-line change once the page is a pure function of the registry. Expected result: about −830 kB gzip on every route, 366 static HTML files served by `next start` without a React render, and a package boundary that makes shipping a lesson body to the browser a build error rather than an accident.

---

## 1. Locked decisions

Proposed 2026-09-28 from a read of the code plus the measurements above. Each needs the owner's "da" (or a change) before code.

### D1 — One `Lesson` contract on disk, two runtime shapes derived from it

`docs/CONTENT_MODEL.md`, the 365 JSON files, `loadCourseFromFiles` and the validator do not change. In `packages/content/src/types.ts` the split is declared once:

```ts
export const LESSON_ARTICLE_KEYS = [
  'content', 'sources', 'byline', 'lastReviewedAt',
  'summary', 'keyPeople', 'keyPlaces', 'subtitle', 'dateLabel', 'timelinePosition',
] as const satisfies readonly (keyof Lesson)[];
export type LessonArticle = Pick<Lesson, (typeof LESSON_ARTICLE_KEYS)[number]>;
export type LessonSummary = Omit<Lesson, (typeof LESSON_ARTICLE_KEYS)[number]>;
/** What the open lesson's header needs on top of the summary. */
export type LessonHeading = LessonSummary & Pick<Lesson, 'subtitle' | 'dateLabel'>;
```

`LessonSummary` is the navigation index: `id`, `courseId`, `sectionId`, `eraId`, `dayNumber`, `order`, `title`, `readingTimeMinutes`, `year`, `isPlaceholder` — exactly the fields the sidebar, drawer, era accordion, timeline marker (`year`), resume rule, bookmarks list and completion counters read today (verified by grepping every `lesson.<field>` access in `ui-web`, `core` and the web client modules). `LessonArticle` is everything only the open lesson, or the server, needs.

**Why `subtitle` and `dateLabel` go to the article side.** Only `LessonHeader` reads them, for the one lesson that is open, and that lesson already arrives as a prop from the server page. Keeping them in the index would cost 27 kB gzip instead of 9 kB (measured: 12-field index 136 kB raw / 26.8 kB gzip vs 10-field 84 kB / 9.2 kB) for no reader. `LessonHeading` is the one-line type that carries them to the header.

**Why derive with `Pick` / `Omit` from `Lesson`** instead of three hand-written interfaces: the canonical contract stays one interface, and the codegen splits on the same `LESSON_ARTICLE_KEYS` constant, so types and data cannot drift.

### D2 — Two generated files from one codegen run

`packages/content/scripts/gen-content.ts` keeps its command (`pnpm gen-content`) and its single `loadCourseFromFiles` call, and writes:

- `src/courses/istorija-srbije-365/_generated.ts` — `course`, `eras`, `sections`, `lessons: readonly LessonSummary[]` (client-safe, ≈ 110 kB pretty-printed).
- `src/courses/istorija-srbije-365/_generated.articles.ts` — `articles: Readonly<Record<LessonId, LessonArticle>>` (≈ 2.4 MB, server-only).

Both carry the AUTO-GENERATED header. One load produces both, so a stale pair is impossible; the "forgot `pnpm gen-content`" foot-gun is unchanged in kind (review item 8 adds the CI diff check). The 8 era-opener `image` blocks and their `apps/web/public/lessons/*.webp` assets are untouched.

### D3 — A server-only entry: `@learn365/content/server`

New `packages/content/src/server.ts`, exported as `"./server"` in the package `exports`:

```ts
import 'server-only';
export function getLessonArticle(courseId: CourseId, lessonId: LessonId): LessonArticle | null;
```

`server-only` (the same zero-byte marker `apps/web/lib/server/**` already uses) becomes a dependency of `@learn365/content`; a client module that imports the entry fails `next build` with Next's standard error. The main entry `@learn365/content` keeps every function it has today; only the lesson return types narrow to `LessonSummary`. `packages/content/vitest.config.ts` gets the same `server-only` alias stub `apps/web/vitest.config.ts` has, so the registry tests can cover the article side.

**Rejected alternative:** an ESLint `no-restricted-imports` rule instead of `server-only`. Lint runs after the build in CI and is skipped by the deploy workflow; the build-time guard is the one that cannot be bypassed.

### D4 — The article is rendered by the server page and handed to the reader as one slot

`LessonReader` gains `article: ReactNode` and drops its own `LessonBody` / `LessonSources` / `LessonTrustLine` rendering. Those three components stay in `@learn365/ui-web` unchanged — none carries `'use client'`, so they render as server components when the page uses them (`LessonBody` already uses `next/image`, which is fine in a server component). The "Uskoro" placeholder block stays inside `LessonReader` (`isPlaceholder` is on the summary). `lesson/[lessonId]/page.tsx` becomes, in outline:

```tsx
const summary = getLessonById(courseId, lessonId);      // @learn365/content
const article = getLessonArticle(courseId, lessonId);   // @learn365/content/server
const heading: LessonHeading = { ...summary, /* + subtitle, dateLabel via conditional spread */ };
<LessonPageClient
  lesson={heading}
  article={<><LessonBody blocks={article.content} />{sourcesOrNull}<LessonTrustLine … /></>}
  … />
```

`generateMetadata` reads `summary` / `subtitle` from the article. Each body then exists once in the HTML and once in the RSC payload for hydration (unavoidable, and about the size of the `content[]` prop it replaces), never in a JS chunk.

### D5 — Providers get their course ids as props; `JumpToDay` is deleted

`AppProviders` (`apps/web/app/providers.tsx`) takes `courseIds: readonly string[]` from the root layout (`getAllCourseIds()` runs on the server) and passes it to `AuthProvider` and `CloudSync`; both drop their `@learn365/content` import. With that, the layout's client graph carries no content at all, and the index (D1) is pulled in only by the Home, course and lesson surfaces that need it. `/privatnost`, `/o-aplikaciji`, `/prijava`, `/nalog` ship the framework and the TopBar only.

`packages/ui-web/src/course/JumpToDay/` is deleted (component, CSS module, barrel export). It has no call site anywhere in the repo, and it is the only value import of `@learn365/content` in `ui-web`, which `docs/APP_ARCHITECTURE.md` §3 already says must be type-only. The other `ui-web` and `core` imports switch to `import type { LessonSummary … }` — no runtime change.

### D6 — Prerender both dynamic routes; unknown ids are a router 404

```ts
export const dynamicParams = false;
export function generateStaticParams() { … }  // course: 1 param set; lesson: 365 { courseId, lessonId } pairs
```

on `course/[courseId]/page.tsx` and `course/[courseId]/lesson/[lessonId]/page.tsx`. Nothing in that tree reads `cookies()` / `headers()` / `searchParams` (the session is fetched client-side from `/api/me`; progress hydrates from `localStorage`), so both routes are already pure functions of the registry and Next marks them static without further change. The `(account)` pages keep `dynamic = 'force-dynamic'`. The existing `notFound()` calls stay as type narrowing.

**Cloudflare stays as it is.** Cloudflare does not cache HTML unless a cache rule says so, and this phase adds none: a cached page that references chunk hashes from a previous deploy is a broken page until purge, and purge-on-deploy is not wired into `deploy.sh`. The win here is on the box (no React render per request; static files streamed by `next start`), not at the edge. An edge cache with purge is a possible follow-up, listed in §8.

### D7 — A bundle budget the build enforces

`apps/web/scripts/bundle-size.mjs` (≈ 30 lines, no dependencies) reads `.next/app-build-manifest.json`, gzips each route's chunks, prints the table, and exits non-zero when any route exceeds **150 kB gzip** or any single chunk exceeds **300 kB raw**. `pnpm --filter @learn365/web check-bundle` runs after `pnpm build` in `ci.yml`. Expected values after this phase are ≈ 105–120 kB gzip per route, so the budget is a ceiling with ~25 % headroom, not a target. It is the durable guard against a heavy field creeping into `LessonSummary` later.

This is the one piece that overlaps review item 8 (CI gates); it is small enough to belong here because it is the acceptance test of item 6. Item 8 proper (Playwright in CI, `gen-content` diff check, `workflow_run` gate on deploy) stays a separate phase.

### D8 — One PR, four commits, each green on its own

- **9a — reader refactor.** `LessonReader` gains the `article` slot; the page renders the article server-side. Still the full `Lesson` from the registry; no data change. Already removes the RSC-prop duplicate.
- **9b — the split.** D1 + D2 + D3 + D5, every consumer moved. The big bundle drop lands here.
- **9c — prerender.** D6. Two files.
- **9d — budget script + CI step (D7) + docs** (`PROJECT_STATE`, `HANDOFF`, `APP_ARCHITECTURE`, `CONTENT_MODEL` note, `DEPLOY`).

No visual change is intended anywhere; the screenshot pack is regenerated once and diffed for zero pixel change on the lesson, course and home shots.

---

## 2. Scope reframe — what Phase 9 is, and what it is not

Phase 9 is a **delivery-shape** phase: same pages, same pixels, same data on disk, different packaging. It changes which side of the client/server boundary the lesson bodies live on, and whether the 366 pages are built once or rendered per request. It does not change the reading experience, the progress / bookmark / sync contract, the content, the design, or the deploy pipeline.

It is not: the trust scaffolding (item 9), honest reading time (item 10), the CI gate set (item 8, except the budget step), the sidebar remount on prev/next, the era-rail truncation (item 12), or any edge caching.

---

## 3. Owner actions

None. No environment variable, DNS, Cloudflare or VPS change. The image grows by roughly 25 MB of prerendered HTML / RSC files; the build stage of the Dockerfile runs the same `next build` it runs today, with 366 more pages.

---

## 4. File-level bundle

### 9a — Article slot in the reader (no data change)

- `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` — new required prop `article: ReactNode`; remove the `LessonBody` / `LessonSources` / `LessonTrustLine` imports and JSX; render `isUpcoming ? <upcoming block> : article`.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/page.tsx` — render `<LessonBody blocks={lesson.content} />`, `<LessonSources>` (only when `sources.length > 0`, as today) and `<LessonTrustLine byline lastReviewedAt />` in the server page; pass them as `article`.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — accept and forward `article`.

Gate: `typecheck`, `lint`, `test`, `build`; Playwright `reader.spec.ts` (first paragraph position, trust line, `Izvori`) and `resume.spec.ts` (first-win moment) green on chromium desktop + mobile. Lesson HTML identical except React's hydration markers around the slot.

### 9b — The split

`packages/content`
- `src/types.ts` — `LESSON_ARTICLE_KEYS`, `LessonArticle`, `LessonSummary`, `LessonHeading` (D1). `Lesson` unchanged.
- `scripts/gen-content.ts` — emit `_generated.ts` (summaries) + `_generated.articles.ts` (articles record) from one load; header comment updated.
- `src/courses/istorija-srbije-365/_generated.ts` — regenerated (shrinks to ≈ 110 kB); `_generated.articles.ts` — new, ≈ 2.4 MB.
- `src/courses/istorija-srbije-365/index.ts` — unchanged; new sibling `articles.ts` re-exporting the record (mirrors the existing pattern).
- `src/registry.ts` — `lessons: readonly LessonSummary[]`; lesson return types narrow. No function added or removed.
- `src/server.ts` — new: `import 'server-only'`, `getLessonArticle`.
- `src/index.ts` — export the three new types and the keys constant.
- `package.json` — `"./server": "./src/server.ts"` in `exports`; `server-only` dependency.
- `vitest.config.ts` + `test/server-only.ts` — alias stub, copied from `apps/web`.
- `src/registry.test.ts` — the "authored seeds" block reads `content` through `getLessonArticle`; new assertions: every summary id has an article and vice versa; no article key appears on a summary (guards the codegen).
- `tooling/eslint-config/index.mjs` — add `**/_generated*.ts` to the shared `ignores` list. Today nothing ignores `_generated.ts`, so ESLint parses the 2.6 MB literal on every run; with two generated files that is worth closing here.

`packages/core`
- `src/navigation/index.ts` — `Lesson` → `LessonSummary` in the four helpers' signatures (`import type`). Tests unchanged (fixtures are supersets).

`packages/ui-web`
- `CourseSidebar`, `SectionAccordion`, `LessonNavItem` — `import type { LessonSummary }`.
- `LessonHeader`, `LessonReader` — `import type { LessonHeading }`.
- `course/JumpToDay/` — deleted; `course/index.ts` export removed.

`apps/web`
- `app/layout.tsx` — `<AppProviders courseIds={getAllCourseIds()}>`.
- `app/providers.tsx`, `lib/auth/AuthProvider.tsx`, `lib/sync/CloudSync.tsx` — `courseIds` prop threaded; content import removed.
- `app/course/[courseId]/lesson/[lessonId]/page.tsx` — `getLessonArticle` from the server entry; build the `LessonHeading`; `generateMetadata` reads `summary` / `subtitle` from the article; `adjacent()` typed on `LessonSummary`.
- `app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — `lesson: LessonHeading`; the sidebar / timeline props stay on the index.
- `app/_components/HomeCurrentLessonCard.tsx`, `HomeEraTimeline.tsx`, `app/course/[courseId]/_components/CourseOverviewEras.tsx`, `CourseOverviewBookmarks.tsx`, `lib/progress/useResumeLesson.ts` — type names only (`Lesson` → `LessonSummary`); they keep importing the now-small registry.
- `app/sitemap.ts` — `lastModified` from `getLessonArticle(...).lastReviewedAt`.
- `lib/server/progress/validation.ts` — unchanged (id existence only).

Gate: all package gates green; `pnpm gen-content` run twice leaves `git status` clean; `pnpm validate-content` green; the `next build` route table shows every route under ≈ 130 kB First Load JS and no chunk above 200 kB raw; a distinctive sentence from Day 200 is absent from `.next/static/chunks/*.js` and present in that lesson's HTML; Playwright chromium desktop + mobile, all specs.

### 9c — Prerender

- `app/course/[courseId]/page.tsx` and `app/course/[courseId]/lesson/[lessonId]/page.tsx` — `generateStaticParams` + `export const dynamicParams = false`.

Gate: `next build` marks both routes `●` (SSG); `.next/prerender-manifest.json` lists the 366 course / lesson routes plus the existing 7; `/course/istorija-srbije-365/lesson/day-999` and `/course/nema/lesson/day-001` answer 404 from `next start`; `/nalog` remains dynamic; Playwright unchanged.

### 9d — Budget guard + docs

- `apps/web/scripts/bundle-size.mjs`; `package.json` script `check-bundle`; `.github/workflows/ci.yml` step after Build.
- `docs/PROJECT_STATE.md` — baseline: "Loading approach" (two generated files, server entry), "Technical baseline" (prerendered routes, budget), new "Phase 9 — done" entry. `HANDOFF.md` — codegen pitfall bullet + next-step pointer. `docs/APP_ARCHITECTURE.md` — §3 (`content` has a `server` sub-entry; `ui-web` is type-only in fact), §4 (rule: `@learn365/content/server` only from server files), §8 (lesson article is server-rendered, the reader chrome is the client island). `docs/CONTENT_MODEL.md` — one paragraph: runtime split, JSON contract unchanged. `docs/DEPLOY.md` — image size note; "Cloudflare does not cache HTML; do not add a rule without purge-on-deploy".
- Move this plan to `docs/archive/phases/PHASE_9_PLAN.md` on merge.

---

## 5. Verification (whole phase)

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm validate-content` green at every commit.
- Sizes, from `pnpm --filter @learn365/web check-bundle` after `pnpm build`: every route ≤ 130 kB gzip (budget 150), largest chunk ≤ 200 kB raw (budget 300). The before / after table goes in the PR description.
- Prerender: `next build` shows `●` for both dynamic routes; `prerender-manifest.json` route count = 373 (7 today + 366).
- Leak check (a one-off command in the PR description, not a permanent test): a sentence from Day 200's body is found in none of `apps/web/.next/static/chunks/*.js` and in exactly one file under `apps/web/.next/server/app/course/`.
- Playwright, chromium desktop + mobile (Firefox / WebKit are not installed on the dev machine): all seven specs. `reader.spec.ts` covers the server-rendered article (first paragraph, `Izvori`, trust line); `resume.spec.ts` covers completion on a prerendered page; `seo.spec.ts` covers canonical / sitemap on a prerendered lesson.
- Screenshot pack (`pnpm screenshots`) diffed against `main`: zero pixel change expected on every shot.
- Manual on `next start`, 390 and 1280 wide: Day 1 (sources + trust line + figure), Day 46 (era-opener figure through `next/image`), Day 365 (end-of-course footer), completion toggle, bookmark, prev / next, drawer, 404 on a wrong id, `/nalog` redirect still works with auth off.
- Production after rollout (owner or next session): a lesson page loads with no JS chunk above ≈ 60 kB in the DevTools network tab; `docker stats learn365-web` idle memory noted next to the pre-phase value in `DEPLOY.md`.

---

## 6. Risks

- **`server-only` inside a `transpilePackages` workspace package.** Next applies the guard to the resolved `server-only` module regardless of where the import sits, so it should behave as it does for `apps/web/lib/server`. Verified in 9b by importing `@learn365/content/server` from `LessonPageClient` once on purpose and watching `next build` fail; if it does not, fall back to an ESLint `no-restricted-imports` rule scoped to client files and record the gap.
- **Vitest and `server-only`.** Importing the marker throws outside Next; the alias stub (D3) is the fix `apps/web` already uses.
- **RSC payload of the lesson page.** The article element tree replaces a `content[]` prop carrying the same information; expect roughly today's payload, not a regression. Checked in 9a with the size of the `?_rsc` fetch; even with React's per-element overhead it stays well under 40 kB per lesson, one request per navigation.
- **Build time and memory.** 366 more pages in `next build`: about +1 minute on the GitHub runner and on the laptop; memory is well within the runner. If the Docker build stage ever runs out of memory, `NODE_OPTIONS=--max-old-space-size=4096` in the build stage is the fix (not needed today).
- **Image size.** ≈ 25 MB more in the runtime layer (HTML + RSC per page). Fine for GHCR and the VPS disk; noted in `DEPLOY.md`.
- **`dynamicParams = false` and future courses.** A new course or lesson must be in `_generated.ts` at build time to have a page — the same rule as today, made explicit (unknown ids are a router 404 instead of a runtime `notFound()`).
- **Type ripple.** About 20 files change a type name; none changes behaviour. The compiler is the safety net: anything still reading `lesson.content` on the client fails `typecheck`.
- **Hydration.** The server HTML for the article is unchanged, and the client now receives the same tree through the RSC payload instead of rendering it from a prop. No mismatch expected; the reader spec asserts zero console errors.

---

## 7. How to proceed

1. **Owner signs off on D1–D8**, or changes them. The two most worth a look: D5 (delete `JumpToDay`) and D7 (the budget numbers).
2. **Branch `feat/phase-9-corpus-split-prerender` off `main`**; commits 9a → 9b → 9c → 9d, each green on its gates before the next.
3. **Open the PR** with the before / after size table and the prerender count in the description; CI must be green including the new budget step.
4. **Merge** (push to `main` deploys). Then the production checks in §5, a "Phase 9 — done" entry in `PROJECT_STATE.md`, this file moved to `docs/archive/phases/`, and `HANDOFF.md` pointed at the next pick — review P1 item 8 (CI gates + Playwright in CI) is the natural successor, since this phase leaves it a budget step to build on.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- Content, the JSON contract, the validator, the 8 era-opener figures.
- Any visual surface, CSS, token or copy.
- The progress / bookmark stores, the sync engine, the auth routes, the database.
- The reader chrome staying a client component (`LessonReader`, sidebar, drawer, completion). The review's "the article is all-client for one scroll effect" is answered for the article; the chrome is a later, optional pass.
- The sidebar remount on prev / next, the era-rail truncation (item 12), reading-time honesty (item 10), trust scaffolding (item 9).
- CI gates beyond the budget step (item 8): Playwright in CI, the `gen-content` diff check, the `workflow_run` gate on deploy.
- Cloudflare edge caching of HTML (needs purge-on-deploy in `deploy.sh` first).
- `optimizePackageImports` / `sideEffects` tuning for the `ui-web` barrel — a separate, smaller bundle item if the budget table shows it matters.
