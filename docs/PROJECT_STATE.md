# Project State

## Current Baseline — 2026-09-29

This section is the single "what is true right now" snapshot of History 365 / Istorija Srbije 365 web v1. Everything below it is the historical phase log that explains how we got here. **Treat this baseline as the new floor — UI/UX should not regress below this state without an explicit owner decision.**

For forward-looking work (what to pick next), see [`HANDOFF.md`](../HANDOFF.md) at the repo root.

### App state

- **Live URL:** https://istorija365.com/ (self-hosted on the owner's Hetzner VPS since 2026-09-27; pipeline and runbook in `docs/DEPLOY.md`). The former Vercel project `learn365-web` was deleted on 2026-09-28; istorija365.com is the only origin.
- **Branch model:** Trunk-based. Each phase ships as one PR merged to `main`. No release branches.
- **Last shipped phase:** Phase 15 — the reader frame (review P2 items 16 + 17 and the rest of 21; PR #53, squash `49d34ae`, live 2026-09-29). Before it Phase 14 — the review's P2 polish bundle A (items 13, 14, 15, 18, 20, 21, 22; PR #51, squash `3de5168`, live 2026-09-28) and, the same day, Phase 13 — the era rail stops truncating (PR #48, `85ebe41`). See "Phase 15", "Phase 14" and "Phase 13" below.
- **Before that (2026-09-27/28, all live):** Phase 12 backend reliability set (PR #46), Phase 11 honest reading time (PR #44), Phase 10 CI gates (PR #42), Phase 9 corpus out of the client bundle + 373 prerendered routes (PR #40), the review's P0 fixes (PRs #37, #38), Phase 8 accounts + cloud progress (PR #34, switched on in production 2026-09-27).
- **Earlier milestones:** Phase 7.6 course-page scroll restore (PR #24, `17f2715`, 2026-05-21), Phase 7.5 mobile sticky-chrome scroll-collapse (PR #23, `4325e64`), Phase 7.12b era-opener figures (`542edad`).

### UI/UX baseline (do not regress)

- **Three primary surfaces:** Home, Course overview (`/kurs/istorija-srbije-365`), Lesson reader (`/kurs/.../lekcija/<id>`), plus editorial About page (`/o-aplikaciji`).
- **TopBar:** sticky, translucent (`backdrop-filter: saturate(160%) blur(14px)`). Brand mark (the wordmark yields to the monogram below 420 px — Phase 14, measured) + nav (`Početna`, `Kurs`, `O aplikaciji`; nothing is active on `/prijava`, `/nalog`, `/privatnost` and the 404 — route `other`, Phase 14) + labelled total-progress capsule (`role="status"` since Phase 14; `Pročitano xxx / 365` + thin bar; post-2026-09-25 the label stays visible at ≤720px and the decorative mini-bar drops there instead of at ≤460px). All nav uses real `next/link` `href`s — `onClick` navigation has been retired across the app. **Mobile (≤720px):** masthead reads Brand · Kurs · ProgressCapsule — `Početna` is hidden (Brand carries Home) and `O aplikaciji` is hidden (footer carries it on every route). Each `<Link>` carries a stable `data-link='home' | 'course' | 'about'` attribute used by the mobile hide rule. **Account slot (Phase 8, live):** after the capsule — nothing while accounts are off; a 28px placeholder while `/api/me` answers; a `Prijava` link (icon-only ≤720px, `data-link='account'`) when signed out; `AccountMark` (picture / initials / glyph, links to `/nalog`) when signed in.
- **Home:** calm hero with the daily-contract caption `365 lekcija · 1 dnevno · 5–7 minuta` (post-7.8; since Phase 11 the minutes are the corpus's derived range, never a literal), 8-era timeline strip (post-7.2; since Phase 13 the bands show `eraShort` on up to two lines with the full title + years as tooltip, the smallest era is floored to 9 % of the rail so its label fits, and a band too narrow for the longest word drops the label, then the year, instead of clipping), state-aware "Tvoj N. dan" daily-ritual anchor (post-7.8; since Phase 14 N is the day of the resume lesson the card beneath opens, never completed + 1) above the recommended-lesson card, footer with about link. The recommended-lesson card no longer carries a duplicate state eyebrow — the anchor above carries it (post-7.8). **Resume rule (post-2026-09-25):** the hero CTA and the recommended card resolve their target through `useResumeLesson` → `findResumeLesson` (`@learn365/core`): Day 1 until something is completed; then the lesson the reader left unfinished, else the first unread day — never a lesson already completed. All-complete → `Otvori kurs` / final day in `done` state. **First visit (post-2026-09-25):** a `Kako funkcioniše` block (three steps + "Dan is an ordinal, not a date") sits between the hero and the daily anchor until the first completed lesson; the hero title is one line from 1100px (`.heroTitle`) and the CTA sits directly under the lede, above the fold at 1440×900 and 1280×720.
- **Course overview:** `CourseProgress` card at top + optional `<CourseOverviewBookmarks>` "Sačuvane lekcije" block (post-7.11, renders only when the user has at least one bookmark in the course — no empty-state copy) + 8 `CourseCard` era blocks. Returning to this page within a browser session restores the prior scroll position (post-7.6) via a `CourseScrollRestore` client component that owns `history.scrollRestoration` and persists the offset to `sessionStorage` (`learn365:course-scroll:<courseId>`); a fresh tab/session lands at top. The progress card is **one canonical row, not two (post-7.9)**, with two states (post-2026-09-25): **start** (nothing completed) — no ring, no `0%`; eyebrow `ZAPOČNI · DAN 001`, lesson title, reading time and a primary pill `Počni od Dana 1 →`; **in progress** — a `ProgressRing` whose centre counts lessons (`N` / `od 365`, never a percent, so the first win is not rounded down to `0%`) + a single journey-day row (`TVOJ N. DAN`, same formula as `HomeDailyAnchor` — `Math.min(completedCount + 1, 365)`; title with a 2-line clamp; `DAN nnn · n min čitanja`; `Nastavi →`) that opens the `useResumeLesson` target. The dual `Aktuelno` / `Sledeće` rows and the redundant `N / 365 završeno` ring caption are gone. The bookmarks surface (when present) is a 2-column card grid on desktop / 1-column on mobile, with each card showing day kicker, lesson title (2-line clamp), and era label. Each era card (post-2026-09-25) is a **disclosure button** — era eyebrow, title, years, **1–2 sentence editorial description always visible (post-7.4)**, and a `Pokaži odeljke · N` / `Sakrij odeljke` hint — with the progress bar and **one labelled action link** beside it (`Počni →` / `Nastavi →` / `Pročitano ✓`) that opens the era's first unread lesson. The former whole-card link + separate toggle pairing is gone. The accent `u toku` chip on the current era card was retired in 7.9 — the accent title colour and the non-zero progress bar carry that signal. **On fresh state, all eras default closed** so the page reads as 8 editorial blocks.
- **Lesson reader:** publication-style layout, 4-item breadcrumb chain (`Početna · Course · Era · Section` — four ancestor links, none `aria-current`, since Phase 14; **desktop-only post-2026-09-25** — ≤1024px the sticky context header + the eyebrow era prefix carry location) — location hierarchy only; the day position is no longer a crumb (post-2026-05-21) since it duplicated the dedicated `Dan nnn / 365` indicator, `LessonHeader` (eyebrow `[eraShort ·] n min čitanja · date` — the era prefix shows ≤1024px only; the byline / last-reviewed trust line moved out of the header into `LessonTrustLine` after `Izvori`, post-2026-09-25; plus a save-for-later bookmark toggle pinned top-right of the header on every non-placeholder lesson, post-7.11 — labelled `Sačuvaj` / `Sačuvano` on desktop and carrying a tooltip that saved lessons live on the course page, post-2026-09-25), `LessonReader` body, optional closing `<LessonSources>` "Izvori" editorial block when the lesson carries `sources[]` (post-7.10), `MarkAsCompletedButton` (`Označi kao pročitano` → `Pročitano` since Phase 14 — one family with every counter), `PreviousNextLessonNavigation` before completion / `CompletedFooter` after it (post-2026-09-25: a first-win moment — `Prvi dan je iza tebe.` on the first completion, `Dan N je iza tebe.` later — with `Pročitano N / 365` beneath, above the next-lesson card; the reader scrolls it into view on the false→true edge only, reduced-motion aware; **since Phase 15** the `SignInPrompt` card closes the footer — after the next-lesson card and the previous-lesson link — when ≥ 2 lessons are done, accounts are on, nobody is signed in and `Ne sada` was not pressed, **on one lesson per browser session**), sidebar with era → section → lesson indent guide (1px hairline rule, color-mixed at 60% of `--rule`). **Frame (Phase 15):** the two-column layout is capped at `--shell-max` (1440 px) and centred, so on a wide window the outline sits in the TopBar's box (a left rule on the sidebar from 1520 px); the gutter between the outline and the article is `clamp(40px, 5vw, 80px)` — 64 px at 1280, 72 at 1440, 80 from 1600; the article stays left-anchored. **Persistent shell (Phase 15):** the outline, the drawer and the sticky context header live in the lesson route's layout, so previous / next keeps the sidebar's scroll position and what the reader opened by hand, and the open lesson's row is brought into view when it is outside it (the list scrolls, never the page). Image blocks render via `next/image` inside a real `<figure>` + `<figcaption>` (post-7.10) — the prior placeholder div is gone. Reading-progress hairline (`<ReadingProgress />`, 2px accent fill pinned to the viewport top) tracks scroll position on every lesson and hides on non-scrollable pages.
- **Mobile:** responsive web only (no native app yet). `MobileLessonDrawer` combines timeline + outline in a single scrolling panel: since Phase 15 it opens with the era rail (`HistoricalTimeline` `compact`, eyebrow `Vremenska osa`) above the outline (eyebrow `Sadržaj`), still centred on the current lesson, and closes when a lesson is chosen. Breadcrumb shows last two crumbs on `≤560px`. Compact `LessonContextHeader` chrome (post-6.7), sticky at all single-column widths (≤1024px), is **always fully visible while scrolling** (post-2026-05-21) and, post-2026-09-25, **one row**: `Sadržaj` trigger · `Dan nnn` (no denominator since Phase 15) · `Pročitano nnn / 365` (the labelled count is the one place course progress is shown on mobile; the era label and thin bar left the header — pinned chrome is 65 + 51 px on a 390px phone). ≤ 720 px the header divider under the lede is a plain rule (Phase 15 — its label repeated the eyebrow's date). The desktop 8-era `HistoricalTimeline` strip sits **after** the article (post-2026-09-25), still hidden ≤1024px, and since Phase 13 shows numerals only (the era name and years are in each band's tooltip and in the sidebar rows — its ~700 px column cannot hold labels without clipping); the `LessonTimeline` date divider hides its tick row ≤720px.
- **Share previews / SEO (post-2026-09-25):** `apps/web/lib/seo/metadata.ts` owns `SITE_URL`, `SITE_DESCRIPTION` and `shareMetadata()`; root layout sets `metadataBase`, course + lesson pages use `generateMetadata` (lesson title reads `Dan N: <title>`), About sets its own. One static card `public/og/istorija-srbije-365.jpg` (1200×630) serves every page. **Post-2026-09-28 (PR #38):** every page also carries `alternates.canonical` (resolved against `metadataBase`); `app/sitemap.ts` lists Home, About, Privacy, the course and all 365 lessons (`lastModified` from `lastReviewedAt`); `app/robots.ts` disallows `/api/`, `/prijava`, `/nalog`; `SITE_URL` falls back to `https://istorija365.com`, never to the Vercel origin.
- **Account pages (Phase 8, live):** `/prijava` (one `Nastavi sa Google-om` button, a calm `?greska=` line, an "unavailable" state while accounts are off), `/nalog` (name, email, `Odjava`, two-step `Obriši nalog`), `/privatnost` (what is stored, where, how long, how to delete; since 2026-09-29 also a `Statistika poseta` section; linked from the Footer). Reading never requires an account.
- **Vocabulary, day labels, the pill (Phase 14):** completion is *pročitano* (button, counters, era card, how-it-works step), start is *počni* (`Počni kurs`, `Počni od Dana 1`, `Počni`), `Nastavi` continues; second-person copy avoids gendered past tense. Day numbers come from `@learn365/core` `format/day.ts` only — `001` (sidebar rows), `DAN 001` (eyebrows), `DAN 001–005` (section rows), `Dan 1` (prose, metadata), `Tvoj N. dan` — and `D001` is gone. Every filled / outlined / quiet action is the `Button` primitive (`primary` / `outline` / `quiet`; `href` renders `next/link`, `plainAnchor` a plain `<a>` for `/api/**`); no surface carries pill CSS. `<html lang="sr-Latn">`; `--faint` colours decoration only.
- **Visual direction:** Editorial only (Spectral serif + Inter + JetBrains Mono, warm Editorial palette, OKLCH-defined tokens). No user-facing theme toggle. Modern direction is dev-only reference.

### Content baseline

- **Canonical content contract:** [`docs/CONTENT_MODEL.md`](./CONTENT_MODEL.md) (entity schema) + [`docs/CONTENT_AUTHORING.md`](./CONTENT_AUTHORING.md) (how to write a lesson).
- **Hierarchy:** `Course → Era → Section → Lesson`. Eras drive the timeline (8 total); Sections drive sidebar grouping (37 total); Lessons are the daily unit (365 total).
- **Content status (post-2026-05-19):** **365 authored / 0 placeholder.** Every day of the course carries real editorial content. `validate-content` enforces this floor.
- **Loading approach:** JSON drop-in. The editable source is `content/courses/istorija-srbije-365/*.json` (`course.json` + `eras.json` + `sections.json` + 365 `lessons/day-NNN.json`). A codegen script `pnpm gen-content` reads the JSON once and writes **two** modules under `packages/content/src/courses/istorija-srbije-365/` (post-Phase 9): `_generated.ts` — course, eras, sections and the lesson *summaries* (`LessonSummary[]`: `id`, `courseId`, `sectionId`, `eraId`, `dayNumber`, `order`, `title`, `readingTimeMinutes`, `year`, `isPlaceholder`; the navigation index, ~9 kB gzip, imported by the registry and therefore by client code) and `_generated.articles.ts` — the lesson *articles* (`content`, `sources`, `byline`, `lastReviewedAt`, `summary`, `keyPeople`, `keyPlaces`, `subtitle`, `dateLabel`, `timelinePosition`; ~800 kB gzip) reachable only through `@learn365/content/server` (`getLessonArticle`, `import 'server-only'`). The split is declared once, as `LESSON_ARTICLE_KEYS` in `packages/content/src/types.ts`; the JSON contract and the `Lesson` type are unchanged. Since Phase 11 `readingTimeMinutes` and `course.estimatedMinutesPerLesson` are **derived by the loader** (`max(1, ceil(words / 150))` per lesson over paragraph / heading / quote text; the median for the course) and must not appear in the JSON — the loader rejects them; `getReadingTimeRange(courseId)` gives the honest range the copy promises (`5–7 minuta` today). **Anyone editing JSON must run `pnpm gen-content` to refresh both generated files** — otherwise the app shows stale content. (Auto-regen on edit is a known quality-of-life gap; see HANDOFF.)
- **Lesson schema (post-2026-05-19):** in addition to `id`, `courseId`, `sectionId`, `eraId`, `dayNumber`, `order`, `title`, `readingTimeMinutes`, `year`, `content[]`, lessons may carry `subtitle`, `dateLabel`, `timelinePosition`, `summary`, `keyPeople[]`, `keyPlaces[]`, and (post-7.10) `byline { author?, reviewer? }`, `lastReviewedAt` (ISO date), `sources[]` (typed-kind union: `book | article | museum | archive | web`). Paragraph blocks may carry `dropcap: true` for an editorial opening cap. The `image` `LessonBlock` (post-7.10) requires `width` / `height` for `next/image` rendering. `isPlaceholder: false` on every lesson in the current corpus; the field and the upcoming-state code path remain for any future re-introduction.
- **Trust scaffolding content status (post-7.10):** 6 seed lessons (Days 1, 7, 31, 106, 200, 305) carry `lastReviewedAt: 2026-05-19` and 3–4 sources each. All 359 other lessons render unchanged. No lesson carries a `byline` yet — the renderer is wired but each name needs to be authored explicitly (no generic course-wide fallback).
- **Era-opener figure status (post-7.12b):** the 8 era-opener lessons (Days 1, 46, 106, 151, 196, 231, 281, 341) each carry one `image` block at `content[1]` (between the dropcap paragraph and the second paragraph). Sources are Wikimedia Commons under PD-1923 / PD-Serbia / CC BY / CC BY-SA. Attribution lives in the caption string. Binary assets sit at [`apps/web/public/lessons/era-{1..8}-{slug}.webp`](../apps/web/public/lessons/). All 357 non-era-opener lessons stay imageless by design.
- **Era editorial copy:** every era has a 1–2 sentence description rendered on the course page (wired in Phase 7.4b). Era descriptions live alongside era metadata in the content package.

### Technical baseline

- **Stack:** pnpm workspaces + Turborepo, Next.js 15 App Router, TypeScript strict, CSS Modules + global token CSS variables, Zustand + persist for local progress, Vitest + Playwright.
- **Monorepo:** `apps/web`, `packages/{ui, ui-web, core, content}`, plus `tooling/` and `docs/`. `apps/mobile` and `apps/api` not present.
- **Progress storage:** `localStorage` via the `ProgressStorage` adapter in `@learn365/core` — unchanged by Phase 8, which adds a sync layer beside the store (see "Accounts + cloud sync" below) instead of swapping the adapter.
- **Bookmark storage (post-7.11):** `localStorage` via a parallel `BookmarkStorage` adapter in `@learn365/core` (separate `learn365:bookmarks:v1` key, separate `createBookmarkStore`). Phase 8 syncs it through `/api/me/bookmarks` with the same engine as progress.
- **Accounts + cloud sync (Phase 8, live):** Google sign-in (authorization code + PKCE written against Google's endpoints; a `sessions` table + a `__Host-l365_session` cookie (Phase 14; the pre-Phase-14 name `l365_session` is read for one release and migrated on the next `/api/me`), 30 days sliding), Postgres 17 via Drizzle (`apps/web/lib/server/db`, migrations applied at server start from `instrumentation.ts`), PGlite for the laptop and Vitest, route handlers under `apps/web/app/api/**`, and a browser sync engine (`apps/web/lib/sync`): union once per browser — only while no cloud marker exists; a marker naming another user takes the replace path (post-2026-09-28) — server authoritative on later loads, coalesced PATCH deltas; when `/api/me` says "accounts on, no session" while a marker exists, the local copy is cleared as an implicit sign-out (post-2026-09-28). **Auth-off is the default** — without `DATABASE_URL`, `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` the app is byte-for-byte the pre-Phase-8 app; CI and Playwright run that way. **Failure modes (Phase 12):** `GET /api/me` always re-sets the session cookie to the row's expiry; a database outage is a `503 unavailable` from every `/api/me/**` route (never a 401 — the sync engine keeps its deltas and retries), pages treat it as signed-out; postgres.js runs with `connect_timeout` 5 s / `statement_timeout` 10 s; an unreachable database at server start does not stop the server (reading works, migrations retry in the background), a failing migration still does; `deploy.sh` rolls back to the previous tag when the new image never becomes healthy; nightly dumps are mode 600 and verified with `pg_restore --list`.
- **Node:** local Node 24 (official installer); CI and the Docker image Node 22 via `.nvmrc` (bumped from 20 on 2026-09-26, Node 20 being end-of-life); `engines` set to `>=20.10`.
- **Deploy pipeline (since 2026-09-26; migration completed 2026-09-28):** `apps/web/Dockerfile` (Next standalone, opt-in via `NEXT_STANDALONE=1`) + `.github/workflows/deploy.yml` (image → GHCR → ssh rollout) + `deploy/` (compose, tunnel template, VPS scripts). Target is the owner's Hetzner VPS behind a Cloudflare Tunnel, fully isolated from the Računi app on the same box. The Vercel project was deleted on 2026-09-28. Procedure and status table: `docs/DEPLOY.md`.
- **Build/test gates:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all green on every merged phase (since Phase 14 `typecheck` also type-checks `e2e/` + the Playwright configs, and `apps/web` lint runs the rules of hooks, Next's core-web-vitals and jsx-a11y), plus (post-Phase 9) `pnpm --filter @learn365/web check-bundle` after the build, in CI too: every route ≤ 175 kB gzip client JS, every chunk ≤ 300 kB raw (`apps/web/scripts/bundle-size.mjs`, reads `.next/app-build-manifest.json`). Playwright suite: **41 tests** in eight specs (`smoke`, `resume`, `first-impression`, `reader`, `course`, `seo`, `auth-off`, `privacy`), 5 browser profiles in the config; **CI runs Chromium desktop + mobile on every PR and push to `main`** (post-Phase 10: its own `e2e` job in parallel with the validate job; Firefox/WebKit stay local-only and are not installed on the dev machine). Known skips: the 2 documented WebKit skip-link skips plus the layout-bound reader tests, which skip on the profile whose layout they do not describe (3 on desktop: meta row, sticky header, drawer; 3 on mobile: outline persistence, deep-link reveal, wide frame). Last run (Chromium desktop + mobile): 76 pass / 6 skip (2026-09-29). Also post-Phase 10: CI fails when `_generated.ts` / `_generated.articles.ts` differ from what `pnpm gen-content` produces (checked before the build), and `deploy.yml` starts only from a green CI on `main` (`workflow_run`) — a red CI deploys nothing.
- **Delivery shape (post-Phase 9, 2026-09-28):** client JS per route is 100–141 kB gzip (the corpus chunk of 824 kB gzip is gone; the navigation index is ~15 kB gzip on Home / course / lesson routes only). The course overview and all 365 lesson pages are prerendered at build time (`generateStaticParams` + `dynamicParams = false`; `prerender-manifest.json` lists 373 routes; unknown ids are a router 404) and served by `next start` as static files with `cache-control: s-maxage=31536000`; the account pages and `/api/**` stay dynamic. Cloudflare does not cache HTML (no cache rule; adding one needs purge-on-deploy first — `docs/DEPLOY.md` §12). Since Phase 15 the whole reader (`LessonReader`: trail, header, article) is rendered by the server page; the client parts are the layout's shell (`LessonShell`: outline, drawer, sticky header) and three islands on the page (bookmark toggle, footer, era strip). **Security headers (Phase 14):** every response carries a CSP (`default-src 'self'`; inline scripts and styles allowed — no nonce, so prerendering stays; images also from `*.googleusercontent.com`; since 2026-09-29 one foreign script origin, `static.cloudflareinsights.com` — Cloudflare Web Analytics, see "Visit statistics" below), HSTS (production build), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, a `Permissions-Policy`; `x-powered-by` is off.
- **Lighthouse (last measured Phase 5):** desktop 99–100 across Perf/A11y/BP/SEO; mobile A11y/BP/SEO 100, mobile Perf 82–85 (accepted for v1; root cause is the three Google-served font families, fix would conflict with Editorial typography).

### Known issues / carry-forward deferrals

- **Contact alias forwarding** — `kontakt@istorija365.com` is in the copy (post-2026-09-28); forwarding to the owner's inbox is set up in Cloudflare Email Routing and was verified with a test mail on 2026-09-28 (`docs/DEPLOY.md` §11).
- **Screen-reader smoke** — VoiceOver / NVDA on TopBar nav, breadcrumbs, accordion, completion toggle. Still outstanding from Phase 5 manual gates.
- **Editorial review** of the 6 authored seed lessons (`packages/content/src/courses/istorija-srbije-365/lessons/authored/`) for historical voice, accuracy, period coverage. Still outstanding from Phase 5 manual gates.
- **Mobile Perf 82–85** on Lighthouse. Accepted for v1; revisit only if real-user metrics regress.

### Explicitly deferred (not in v1)

- Payments, subscriptions, push notifications, streaks, quizzes, admin/CMS, AI content generation, native mobile (Expo), user-facing theme toggle. (Authentication and backend persistence left this list with Phase 8.)
- Backend: Phase 8 (route handlers + Postgres inside `apps/web`) is built — [`docs/BACKEND_STRATEGY.md`](./BACKEND_STRATEGY.md), [`docs/archive/phases/PHASE_8_PLAN.md`](./archive/phases/PHASE_8_PLAN.md).
- Native mobile (Expo) is planned in [`docs/MOBILE_NOTES.md`](./MOBILE_NOTES.md) as Phase 8b, built after backend.

### Next-step pointer

The next phase pick is recorded in [`HANDOFF.md`](../HANDOFF.md) at the repo root. As of 2026-09-29 the product review's engineering items are done: P0, P1 (6, 7, 8, 10, 11, 12) and P2 (13–18, 20–22). What remains is the owner's: item 9 (trust scaffolding) and the P3 editorial work, item 19 (brand / About tone), the desktop half of Phase 13 D5 (drop the era strip under the article), the box-side steps in `docs/DEPLOY.md` §13 — and the carry-forward deferrals listed above.

---

## Historical phase log

The remainder of this document is the chronological build log. Each phase entry records the locked decisions, files touched, gates run, and rationale. The log is append-only — use it to answer "why did we build it this way?" or "when did X change?" The current state of any component or surface lives in the **Current Baseline** section above, not in the phase log.

## Phase 16 — Pregled naloga: the owner's read-only accounts overview (2026-09-29): built, in PR

Requested by the owner on 2026-09-29 ("hoću stranicu"). `CLAUDE.md` lists "admin panel" under *do not implement unless explicitly requested*; this is that request, scoped to one read-only page. Plan: `docs/PHASE_16_PLAN.md` (eight locked decisions).

**What changed:**
- **Data + access.** `users.is_admin boolean not null default false` (migration `0001_admin_flag`, additive). No code path writes it; the owner sets it by hand on the box (`docs/DEPLOY.md` §15). `resolveOverviewAccess` (4 tests): accounts off → 404, signed out → `/prijava?nazad=/pregled`, signed in without the flag → 404, with it → the page. `getAccountsOverview` (5 tests, PGlite): total, new and active in 7 days, and per account — name, e-mail, registered, last activity (the later of the last sign-in and the last progress change), lessons read, lessons saved; newest first, capped at 500 rows; never the Google `sub`, the picture or the flag. `formatAccountDate` / `formatLastActivity` (6 tests): Serbian month names, Belgrade calendar days, `danas` / `juče` / `pre N dana`.
- **Page.** `/pregled` (server component, `force-dynamic`, `noindex`, no `/api/**` route behind it): three figures between two rules, a hairline table; on a phone each account is a block with labelled facts. `/nalog` shows a quiet `Pregled naloga` link to a flagged account only. `robots.txt` disallows `/pregled`. `/privatnost` → `Sa Google nalogom`: "Spisak naloga vidi samo osoba koja vodi sajt."
- **Fix found on the way — account cards glued to the masthead.** `/prijava`, `/nalog` and the 404 put `.shell` (global, `padding: 0 40px`) and the page's `.wrap` (`padding: 80px 0 120px`) on one element; whichever stylesheet loaded last won. Since Phase 14 the global one loads last, so the cards sat directly under the masthead (measured 0 px; 80 px before Phase 14, when the gutters were the ones lost). The two classes are on separate elements now; an e2e test holds the room (≥ 40 px) and the gutters (≥ 16 px). **Not changed:** Home and the course overview have the same collision and have shown 0 px of top padding since at least Phase 7.6 (May) — that is the approved look, so it was left for the owner to decide.

**Verified locally with accounts on** (PGlite, ten invented accounts, a flagged session and a plain one): as the owner `/pregled` 200 with the figures and ten rows, no console error, no horizontal overflow at 1280 or 390, `cache-control: private, no-cache, no-store`; a plain account gets the 404 page and no e-mail address in the HTML, and no link on `/nalog`; signed out and with a forged cookie `307 → /prijava?nazad=%2Fpregled`.

**Gates:** typecheck, lint, unit tests (web 104 → 119), build (`/pregled` dynamic, 375 static pages), bundle budget; Playwright Chromium desktop + mobile **80 pass / 6 skip**.

**Owner action (turns it on):** sign in once, then on the box `docker exec -i learn365-db psql -U learn365 -d learn365 -c "update users set is_admin = true where email = '<address>';"` — `UPDATE 1`. Until then `/pregled` is a 404 for everyone.

## Visit statistics — Cloudflare Web Analytics allowed (2026-09-29): done (PR #55, `ab4442d`, live)

Owner decision 2026-09-29, after the Phase 15 production check found that Cloudflare injects its Web Analytics beacon into the HTML and the Phase 14 CSP refuses it. The owner chose to count visits and say so, over switching the injection off. One commit of code, one of docs.

**What changed:**
- **CSP.** `script-src` also allows `https://static.cloudflareinsights.com` — the one foreign script origin (`next.config.mjs`). `connect-src` stays `'self'`: the beacon reports to this origin (`/cdn-cgi/rum`).
- **`/privatnost`.** New section `Statistika poseta`: visits are counted with Cloudflare Web Analytics, without cookies and without following the reader to other sites; what is recorded (the page, where the reader came from, browser and system, country, load time); not tied to the account or the progress, not used for ads. `Bez naloga` no longer says `Nemamo analitiku` or `ništa ne napušta tvoj pregledač`; `Gde i koliko dugo` names Cloudflare as the keeper of the statistics; the session cookie is named as it is since Phase 14 (`__Host-l365_session`); last change 29. septembar 2026.
- **Test.** `e2e/privacy.spec.ts`: the policy allows exactly one foreign script origin and no foreign `connect-src`; the page has the section and not the old sentence. The page and the policy change together.

**Measured on production before the change** (one browser with the CSP bypassed): the script comes from `static.cloudflareinsights.com/beacon.min.js`; reports are `POST https://istorija365.com/cdn-cgi/rum`; the context holds **no cookie** afterwards; a report carries the page URL, the referrer, browser engine and version, OS version, load timings and a per-page-load id.

**Not changed:** no analytics code in the repo — Cloudflare injects the beacon at the edge for browser requests (a plain `curl` gets HTML without it). Switching statistics off again is one toggle in the Cloudflare dashboard (`docs/DEPLOY.md` §14) plus the reverse of this change.

**Gates:** typecheck, lint, unit tests, build, bundle budget; Playwright Chromium desktop + mobile 76 pass / 6 skip. **Check after a rollout:** `curl -sI https://istorija365.com/ | grep -i content-security` names the origin; a browser console on any page shows no CSP error; visits appear in the Cloudflare dashboard (Web Analytics) within minutes.

**Production after the rollout** (merge 08:35:25 UTC → live 08:39:41, through the CI gate): `/api/health` ok; the live `script-src` reads `'self' 'unsafe-inline' https://static.cloudflareinsights.com`; in a browser with the real policy, on Home, a lesson and `/privatnost`: **no console error**, the beacon script `200`, its reports `POST /cdn-cgi/rum` `204`, **no cookie** in the context; `/privatnost` shows `Statistika poseta` and `Poslednja izmena: 29. septembar 2026.`, the old sentence is gone.

## Phase 15 — The reader frame: persistent shell, desktop frame, mobile stack (2026-09-29): done (PR #53, `49d34ae`, live)

Review P2 items 16 + 17 and the part of item 21 Phase 14 left for here, planned in `docs/archive/phases/PHASE_15_PLAN.md` (eight locked decisions; built under the standing authorization of 2026-09-28). Four commits, one PR (#53, squash `49d34ae`, merged 2026-09-29 06:54 UTC). The lesson route only: no route, stored data or API changed, and no other page moved.

**What changed:**
- **15a — Shell + islands.** `app/course/[courseId]/lesson/layout.tsx` renders `LessonShell` (client) around the page: the sticky `CourseSidebar`, the `MobileLessonDrawer`, the `LessonContextHeader`, `ReadingProgress`, the open-era / open-section sets, the drawer state and `markOpened` — everything that belongs to the course. It reads the open lesson from `useParams()` + the navigation index; the current era and section are opened by adjusting state during render (not in an effect), the drawer closes when the lesson changes. `LessonReader` lost `'use client'` and its callbacks and is rendered by the server page with three client islands handed in as nodes: `LessonBookmarkToggle` (→ new `LessonBookmarkButton`), `LessonCompletion` (→ new `LessonFooter`) and `LessonEraStrip`. `LessonPageClient` deleted; `useEraTimeline` is the one source of per-era stats for the strip and the drawer rail.
- **15b — Desktop frame.** `.layout` capped at `--shell-max` and centred; a left rule on the sidebar from 1520 px; gutter `clamp(40px, 5vw, 80px)`. `CourseSidebar` `revealCurrent` + `revealScrollTop()` (6 tests): a row outside the list's visible box is centred in it — instantly on mount, smoothly after a navigation, never by scrolling the page.
- **15c — Mobile stack.** `LessonContextHeader` reads `Dan 003`; ≤ 720 px the `LessonTimeline` divider is its hairline only; the drawer's list starts with the era rail (`CourseSidebar` `lead` slot, outside the `nav` landmark) under a `Vremenska osa` eyebrow, the outline under `Sadržaj`; the compact rail's numeral column is wide enough for `VIII` (it was never rendered before, and `VIII` ran into its title). The sign-in ask moved to the end of the completed footer (`CompletedFooter` lost `afterMoment`) and is shown on one lesson per browser session: `isSignInAskDue()` (7 tests) + `learn365:signin-prompt:session:v1` in `sessionStorage`, cleared on sign-out with the other account keys.
- **15d — Tests + docs.** Five reader e2e tests (outline persistence across next, deep-link reveal, the frame at 1920, the sticky header + divider, the drawer rail + close on navigation); this file, `HANDOFF.md`, `APP_ARCHITECTURE.md` §8, `COMPONENT_LIBRARY.md`.

**Measured (Chromium, local production build, before → after):**

| What | Before | After |
| --- | --- | --- |
| 1920 px: sidebar / article / brand | 0–320 / 360–1020 / 280 | 240–560 / 640–1300 / 280 |
| 1520 px: sidebar / article / brand | 0–320 / 360–1020 / 80 | 40–360 / 436–1096 / 80 |
| Gutter outline → article at 1100 / 1280 / 1440 / 1920 | 40 / 40 / 40 / 40 px | 55 / 64 / 72 / 80 px |
| Next at 1440, one era opened by hand, outline scrolled 180 px | scroll 0, era closed | scroll 180, era open, row in view |
| `day-340` opened directly at 1440 × 900 | — | row in view (list scrolled 380 px, page 0) |
| 390 px: context header day | `Dan 003 / 365` | `Dan 003` |
| 390 px: header divider | 31 px with a repeated date | 1 px rule |
| 390 px: first paragraph starts at | 546 px | 516 px |
| Drawer | outline only | era rail (373 px, scrolls with the list) + outline |
| Horizontal overflow at 390 – 1920 | none | none |

Client JS: the lesson route's first load is 141 kB in the build table (`check-bundle`: page entry 138.3 kB gzip, the new layout entry 137.9 kB gzip, budget 175); 375 static pages, `prerender-manifest.json` 373 routes; `day-200` `200` + `x-nextjs-cache: HIT` from `next start`.

**Deviations from the plan:** none in substance. One finding outside it: on Home ≤ 720 px the rail's `VIII` sits 2 px from its title (the numeral column is 23 px, the numeral 33 px). Widening the column there re-wraps two era titles onto a fourth line, so Home was left as it is; the drawer's rail, which has the room, got the wider column.

**Owner decisions left open:** the desktop half of Phase 13 D5 (drop the era strip under the article — the strip stays); whether the Home rail's numerals should be serif, as the stylesheet's comment intends (the global `.mono` class wins today), which would also close the `VIII` gap.

**Gates:** `pnpm typecheck` (incl. e2e), `pnpm lint`, `pnpm test` (ui-web 38 → 44, web 97 → 104), `pnpm build`, bundle budget, Playwright Chromium desktop + mobile **72 pass / 6 skip**; screenshots at 390, 1280, 1440 and 1920 read before the PR. PR #53 CI: validate 1 m 30 s, e2e 1 m 33 s (72 / 6). Gated rollout: merge 06:54:45 UTC → CI green 06:56:25 → Deploy created 06:56:27 (`workflow_run`) → live 06:58:39 = **3 m 54 s merge → live**.

**Production after the rollout:** `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`; `day-200` `200` + `x-nextjs-cache: HIT`, the CSP and HSTS headers in place, the HTML carries the bare `Dan 200` and the outline inside the layout's `aside`; `day-999` `404`. The sign-in ask, which the local suite cannot see (accounts off), checked in a signed-out browser with three lessons seeded locally: on the first completed lesson opened it sits under the next-lesson card and the previous link (moment 4077 → card 4142 → previous 4316 → ask 4380 px); on the next lesson it is absent — after a full load and after a client navigation; back on the first lesson it is still there.

**Found on production, not caused by this phase:** Cloudflare injects its Web Analytics beacon (`static.cloudflareinsights.com/beacon.min.js`) into the HTML and the CSP of Phase 14 refuses it — one console error per page, nothing collected, nothing visible. Owner decision (HANDOFF): switch the injection off in Cloudflare, which matches what `/privatnost` promises, or allow it and say so.

## Phase 14 — P2 polish bundle A: one vocabulary, one day label, a11y, secondary chrome, security headers, code hygiene, docs drift (2026-09-28): done (PR #51, `3de5168`, live)

Review P2 items 13, 14, 15, 18, 20, 21, 22, planned in `docs/archive/phases/PHASE_14_PLAN.md` (eight locked decisions; built under the standing authorization of 2026-09-28). Five commits, one PR (#51, squash `3de5168`, merged 2026-09-28 21:24 UTC). Items 16 + 17 (the reader layout) are Phase 15; item 19 (brand / About tone) is the owner's.

**What changed:**
- **14a — One vocabulary + one day formatter.** `MarkAsCompletedButton` reads `Označi kao pročitano` / `Pročitano` and the how-it-works step 2 repeats it verbatim; the start family is *počni* (`Počni kurs` on the hero, `Počni · DAN 001` on the course card); the end-of-course line, the sign-in ask, the daily anchor, the 404 and step 3 no longer use gendered past tense. `@learn365/core` `format/day.ts` (`padDay`, `formatDayEyebrow`, `formatDayRange`, `formatDayProse`, `formatJourneyDay`, 5 tests) replaces ten local `formatDay` copies; `D001` is gone (sidebar rows `001`, section rows `DAN 001–005`). `useResumeLesson` returns `journeyDay` — "Tvoj N. dan" is the resume lesson's day on Home and the course overview, so it always matches the `DAN nnn` beneath it; the hardcoded 365 is gone. `@learn365/ui-web` now depends on `@learn365/core`.
- **14b — Contrast, language, ARIA, secondary chrome.** `--faint` (≈ 2.6 : 1) is decoration only — sidebar minutes, era years, rail years, disabled prev/next and placeholder rows read in `--muted`; `<html lang="sr-Latn">`; the TopBar capsule and the mobile header count are `role="status"`; `Breadcrumbs` renders any crumb with an `href` as a link and marks `aria-current="page"` only on a last crumb without one (the lesson page: four ancestor links, no false current); the era card's toggle is named by its visible number + title (`aria-labelledby`). `TopBarRoute` gained `other` (`/prijava`, `/nalog`, `/privatnost`, 404 light nothing); `/nalog` has an outlined `Odjava`, no filled primary, and a `Nazad na čitanje` link. **Measured (Chromium):** with `365 / 365` the masthead content is 334 px without the account slot and 378 px with it, against a 320 / 350 / 372 px content box at 360 / 390 / 412 px — it already overran its padding at 360 and would overflow the viewport on every common phone once signed in; the brand wordmark now yields to the monogram below 420 px (visually hidden, the link keeps its name): 289 px at 360, 91 px to spare.
- **14c — Security.** `next.config.mjs` sends a CSP (no nonce — prerendering stays; `'unsafe-inline'` for scripts/styles, images also from `*.googleusercontent.com`, everything else `'self'`, `frame-ancestors 'none'`), HSTS (production build only), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, a `Permissions-Policy`; `poweredByHeader: false`. The session cookie is `__Host-l365_session` on https (`sessionCookieName`, `readSessionToken`, `clearSessionCookies`; the pre-Phase-14 name is read for one release and migrated on the next `/api/me`; sign-out, expiry and deletion clear both; 6 tests); the OAuth state cookie follows the same rule. `deploy/ssh-command.sh` is the forced command for the GitHub Actions key (exactly `bash /srv/learn365/deploy.sh sha-<12 hex>`); `vps-install.sh` writes it for fresh installs; DEPLOY §13 carries the owner's steps for the existing box and the Cloudflare rate-limit rule.
- **14d — Hygiene.** `Button` is the one pill (`primary` / `outline` / `quiet`; `href` → `next/link`, `plainAnchor` → `<a>` for `/api/**`; `iconRight`); the five CSS copies (Home hero, 404, account pages, course start, sign-in ask) are gone. `Card`, `Chip`, `Placeholder` (rendered nowhere) deleted. `readJsonRecord()` in `lib/server/http.ts` replaces four copies of the body-parsing block. `apps/web` lint spreads `@next/eslint-plugin-next` core-web-vitals, `eslint-plugin-react-hooks` and `eslint-plugin-jsx-a11y` (declared directly; `eslint-config-next` — eslintrc-only, never applied — removed), lints `e2e/` and the Playwright configs, ignores the git-ignored `.data/`; `typecheck` also runs `tsc -p tsconfig.e2e.json`; `turbo.json` `dev` depends on `^build`. Not done here, by decision: the article-as-server-component island (Phase 15) and the Spectral italic trim (italic 500 is the brand monogram; per-style weights need self-hosted fonts).
- **14e — Docs.** `CONTENT_MODEL.md` and `CONTENT_AUTHORING.md` rewritten for the contract that exists (JSON under `content/`, `eraId` + `sectionId`, `day-NNN`, derived reading time, `gen-content` + the CI drift check, no stubs); `README.md`, `BACKEND_STRATEGY.md` (no `arctic`, one `CloudSync`), `COMPONENT_LIBRARY.md`, `screenshots/README.md` + `capture.spec.ts` (no placeholder shot) and this file's baseline (date, "last shipped", the "unmerged" markers, four `.NET 9` lines) corrected. The phase log stays in place — every plan and HANDOFF entry links into it by heading.

**Gates:** `pnpm typecheck` (incl. e2e), `pnpm lint` (with the new rules: clean), `pnpm test` (core 72 → 77, web 91 → 97), `pnpm build` (375 routes), bundle budget, Playwright Chromium desktop + mobile 67 pass / 1 skip locally; PR #51 CI: validate 1 m 35 s, e2e 1 m 37 s (67 / 1), image build 2 m 47 s. Gated rollout: merge 21:24:28 UTC → CI green 21:26:17 → Deploy created 21:26:20 (`workflow_run`) → live 21:28:48 = **4 m 20 s merge → live**; production answers with all six headers on `/`, `x-powered-by` gone, `/api/health` ok, `day-200` 200 + `x-nextjs-cache: HIT`.

**Owner actions (DEPLOY §13, none blocking):** the deploy key's forced command; the Cloudflare rate-limit rule; and, still open from P0, rotating the Google client secret.

## Phase 13 — Era rail: stop truncating (2026-09-28): done (PR #48, `85ebe41`, live)

Review P1 item 12, planned in `docs/archive/phases/PHASE_13_PLAN.md` (six locked decisions; built under the standing authorization of 2026-09-28), merged and rolled out through the gate the same evening. Two commits. A component-only phase in `@learn365/ui-web`: no content, route or data change.

**What changed:**
- **13a — Rail.** `HistoricalTimeline` renders both the short and the full era name and CSS shows one: `eraShort` on the desktop Home rail on up to two lines (`-webkit-line-clamp: 2`, `overflow-wrap: normal` — never cut mid-word), the full title in the vertical mobile rows and in the compact variant; the band's tooltip carries the full title + years. `timelineMath`: `MIN_BAND_SHARE = 0.09` + `flooredWeights()` raise the smallest era (VIII, 25 of 365 → 32.85 lesson-equivalents) so its label fits, and a weight-aware `timelineFillPercent(stats, weights)` — bands (CSS `--weight`), marker and fill share one scale; the old `min-width: 64px` pixel floor the maths could not see is gone (it had pushed the lesson strip's marker off its band). `.text` is a size container (`flex: 1`, or it collapses to 0); `@container` rules drop the label when the text box is narrower than the longest single word of any short label — "Despotovina", **measured** 73 px @13 / 79 px @14 in Spectral — and the year when "9500 p.n.e." cannot sit on one line (four-digit years only below ~30 px; `.textBce` marks BCE bands). The lesson page's strip (`full` variant, ~700 px column, 27–75 px text boxes) shows **numerals only** with the marker; names and years are in the tooltip and the sidebar rows. Tests: `timelineMath.floor.test.ts` (7).
- **13b — Docs.** Plan, PROJECT_STATE baseline (Home rail, lesson strip), HANDOFF.

**Measured (Chromium, `getBoundingClientRect` per band):** before — Home @1440 bands 90–215 px, title boxes 57–182 px, **7 of 8 clipped** (also at 1280 / 1100); lesson strip 64–96 px bands (pixel floor), 39–71 px boxes, **8 of 8 clipped**. After — Home @1440 **8 of 8 labels shown, none clipped** ("Savremena Srbija" on two lines, era VIII band 115 px / text 82 px); @1280 six labels, era V and VIII numeral + year; @1100 six labels, V and VIII numeral + year; the marker inside the current era's band at every width; lesson strip numerals I–VIII, `day-341` (first lesson of era VIII) puts the marker inside era VIII's band; mobile rows @390 full titles as before. Screenshots (local, Chromium) of the Home rail, the lesson strip, the mobile rows and the full lesson page read and checked. Bundle unchanged.

**Decision left to the owner (D5):** the review's second suggestion — drop the post-footer strip and render the compact vertical rail inside the sidebar / drawer — changes the reader layout declared a floor; recommended (the strip carries little the sidebar does not), not done.

**Gates:** `@learn365/ui-web` 38 / 38 tests, typecheck, lint; full `pnpm typecheck` + `build` + `check-bundle`; PR #48 CI both jobs green; gated rollout merge 19:48:24 UTC → CI green 19:50:03 → Deploy created 19:50:05 (`workflow_run`) → live 19:52:02, **3 m 38 s merge → live**; `/api/health` ok; production Home HTML carries the short labels and the tooltips. Plan archived to `docs/archive/phases/PHASE_13_PLAN.md`.

## Phase 12 — Backend reliability set (2026-09-28): code done (PR #46, `3a315c8`, live); box rollout (D6) pending the owner

Review P1 item 11, planned in `docs/archive/phases/PHASE_12_PLAN.md` (seven locked decisions; built under the standing authorization of 2026-09-28), merged and rolled out through the Phase 10 gate the same evening. Three commits. A failure-mode phase: same product, same API contract, same schema — different behaviour on the bad day. Nothing a reader sees changed.

**What changed:**
- **12a — Auth + API.** `getSessionFromToken` throws `DbUnavailableError` (with `cause`) instead of returning `null` on a database failure; `guardApi` and `DELETE /api/me` answer `503 { error: 'unavailable' }` (new `apiUnavailable()` in `http.ts`) — never a 401, so the sync engine keeps its deltas and retries; `getCurrentSession` maps the error to signed-out so `/nalog` and `/prijava` still render. `GET /api/me` sets the session cookie on every successful validation with the row's `expiresAt` (a renewal done by any `/api/me/**` route reaches the browser on the next page load). postgres.js: `connect_timeout: 5`, `connection: { application_name: 'learn365-web', statement_timeout: 10_000 }`. `isConnectivityError()` classifies socket / DNS / postgres.js / SQLSTATE (57P03, 53300, 08xxx) codes, following `cause` chains and `errors[]`. Tests: `guard.test.ts` (3), `currentUser.test.ts` (3); helper `test/serverEnv.ts`.
- **12b — Start-up.** `migrateAtStartup()` (called by `instrumentation.ts`) wraps `migrateDatabase()`: a connectivity error is logged, the server starts (reading works, `/api/health` says `db: error`) and the migration is retried in the background every 15 s for 40 attempts; any other error (a migration that fails to apply) still throws, so the container stays unhealthy and `deploy.sh` rolls back. `docker-compose.yml`: `web` depends on `db` with `service_started`. Tests: `migrate.test.ts` (6: the classifier table; `deferred` against `postgres://127.0.0.1:1`; `rejects` for a missing migrations folder on PGlite; `applied` on PGlite).
- **12c — Ops scripts + docs.** `deploy.sh` remembers the previous `IMAGE_TAG`, and when the new image never becomes healthy it restores the tag, brings `web` up again, waits once more and exits 1; the prune keeps the new, the previous and `latest` images. `backup.sh`: `umask 077`; after the dump is in place `pg_restore --list` (via `docker exec -i`, stdin) must list ≥ 1 entry or the script exits 1; the log line carries the count. The off-box copy stays an owner decision (destination). Docs: `DEPLOY.md` §2 / §6 / §10, this file's baseline (failure modes), `HANDOFF.md`.

**Measured:** PR #46 CI green in 1 m 31 s (both jobs); merge 19:12:19 UTC → CI green 19:13:47 → Deploy created 19:13:50 → live 19:16:54 (**4 m 35 s merge → live**); `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`. Web unit tests 91 / 91 (12 new); typecheck, targeted lint, `bash -n`, build + bundle unchanged.

**D6 — not done, tool policy:** the three `deploy/` files were staged on the box as `deploy` (`tar | ssh`, into `/srv/learn365/.phase12/`, 19:12 UTC), but the rollout itself — back up the old files, move the new ones in, `dc.sh up -d web` — is a remote shell write that the Claude Code auto-mode policy refuses, and it was not pursued another way. The owner ran the commands from `DEPLOY.md` §9 at 20:14 UTC the same evening: files in place (old copies kept as `*.bak-2026-09-28`), `dc.sh config` ok, `web` and `db` healthy, `cloudflared` up, Računi untouched; compose kept the running container, so the new `depends_on` applies from the next rollout (which already runs the new `deploy.sh`), and the next nightly backup is the first verified one.

**Gates:** the three new test files green locally and in CI; PR CI both jobs green; gated rollout green; production health ok; Računi untouched (nothing of theirs was read or written).

## Phase 11 — Honest reading time: derived from the text, promised as a range (2026-09-28): done (PR #44, `fc72b29`, live)

Review P1 item 10, planned in `docs/archive/phases/PHASE_11_PLAN.md` (six locked decisions; built under the owner's standing authorization of 2026-09-28) and merged and rolled out through the Phase 10 gate the same evening. Four commits — 11a content, 11b web copy, 11c docs, plus one e2e fix the gate caught. A data-shape phase: the number now comes from the text and the copy from the numbers. No lesson text, no component, no CSS and no display format changed.

**What changed:**
- **11a — Content.** `packages/content/src/loader/readingTime.ts`: `countWords` (whitespace tokens carrying a letter or digit, over paragraph / heading / quote text; image alt / caption excluded), `estimateReadingMinutes = max(1, ceil(words / 150))`, `medianReadingMinutes`. The loader assigns `readingTimeMinutes` and `course.estimatedMinutesPerLesson` (the median) and **rejects both fields** when a JSON file still carries them; the 365 lesson files and `course.json` were stripped (one line each). Validator: the `4..15` band applies to authored lessons only (a placeholder's stub derives to 1); the success line prints `reading time 5–7 min (median 6)`. Registry: `getReadingTimeRange(courseId)`. Tests: `readingTime.test.ts` (10), `registry.readingTime.test.ts` (3). `_generated.ts` regenerated (341 lesson values + the course record changed); `_generated.articles.ts` untouched.
- **11b — Web copy.** `apps/web/lib/copy/readingTime.ts`: `READING_TIME_LABEL` formats the range once (`5–7 minuta`; `6 minuta` / `1 minut` when it collapses; 4 tests). The Home hero contract line (`365 lekcija · 1 dnevno · 5–7 minuta`), how-it-works step 1 (`…, 5–7 minuta čitanja.`, Home + About) and the About mission (`dovoljno 5–7 minuta dnevno`) interpolate it — no literal minutes remain in copy, and the label moves by itself when the corpus does.
- **11c — Docs.** `CONTENT_CONTRACT.md` (both tables, placeholder rules, invariant 13, checklist), `CONTENT_MODEL.md`, `CONTENT_AUTHORING.md` (5–7 minutes ≈ 700–1100 words at 150 wpm), `APP_ARCHITECTURE.md` §7, this file's baseline, `HANDOFF.md`.
- **e2e.** `reader.spec.ts` asserted `Praistorija i antika · 8 min` literally; the Phase 10 gate caught it on the first PR run (66 pass / 1 skip / 1 fail, no merge) — it now asserts `\d+ min`.

**Measured (365 lessons, 2026-09-28):** words min 622 (Day 7) · median 832 · max 1026 (Day 247). Declared minutes before: 6 ×12 · 7 ×219 · 8 ×133 · 9 ×1, correlation with the word count 0.26, 8 lessons matched a word-based estimate. Derived after: **5 ×34 · 6 ×298 · 7 ×33**, median 6. Why 150 wpm and not the review's 160: at 160 Day 7 (622 words) rounds to 4 and the honest label would read "4–7 minuta"; at 150 every lesson lands in 5–7 with headroom (a lesson would need fewer than 600 words to read "4", below the 700–1100-word authoring guideline), inside the attentive-reading band for Serbian prose. Bundle unchanged: every route ≤ 115 kB gzip (the index already carried the field).

**Gates:** `validate-content` green with the new stats line; `gen-content` idempotent after the strip, drift check clean; content 37 / 37 and web 79 / 79 unit tests; typecheck; lint (targeted — the full run fails only on the git-ignored `apps/web/.data/ui-check.mjs`, as in Phase 9); build + `check-bundle`; `next start` smoke: `/` and `/o-aplikaciji` contain `5–7 minuta`, Day 1 / 7 / 247 eyebrows read `6 / 5 / 7 min čitanja`, no `osam minuta` / `~8 minuta` / `8 min čitanja` anywhere. PR #44 CI: first run 66 / 1 / 1 (the e2e literal), second run 67 pass / 1 skip in 22.5 s, both jobs green in 1 m 37 s. Gated rollout of the merge commit: merge 18:49:04 UTC → CI green 18:50:10 → Deploy created 18:50:12 (`workflow_run`) → live 18:52:39, **3 m 35 s merge → live**. Production after the rollout (18:52 UTC): `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`; `/` and `/o-aplikaciji` carry `5–7 minuta`; Day 1 / 7 / 247 eyebrows read `6 / 5 / 7 min čitanja`; no page carries `osam minuta`, `~8 minuta` or `8 min čitanja`. Plan archived to `docs/archive/phases/PHASE_11_PLAN.md`.

## Phase 10 — CI gates: gen-content drift check, Playwright in CI, deploy waits for CI (2026-09-28): done (PR #42, `eb7cc97`, live)

Review P1 item 8, planned in `docs/archive/phases/PHASE_10_PLAN.md` (six locked decisions; owner sign-off 2026-09-28, together with the standing authorization to merge on green CI without per-phase sign-off for the engineering backlog) and built, merged and rolled out through the new gate the same day. Three commits, each green on its own. A pipeline-only phase: same app, same image, same box — different rules for what may reach the box. Nothing under `apps/` or `packages/` changed behaviour (one reporter line in `playwright.config.ts`).

**What changed:**
- **10a — Drift check.** `ci.yml`: `validate-content` moved up next to install; new step `Generated content is current` runs `pnpm gen-content`, `git add -N packages/content/src/courses` and fails on `git diff --quiet` with the `--stat` (1 s on the runner). `**/_generated*.ts` added to `.prettierignore` — without it `prettier --check` flags `_generated.ts` (double quotes), so a `pnpm format` would have tripped the check.
- **10b — Browser suite.** Second job `E2E (Chromium desktop + mobile)` in `ci.yml`, in parallel with `validate` (no `needs`): install → `playwright install --with-deps chromium` (22 s) → `pnpm build` (32 s) → `playwright test --project=chromium-desktop --project=chromium-mobile` (≈ 20 s) → traces uploaded on failure. No env vars, so accounts are off exactly as locally. `playwright.config.ts`: `github` reporter on CI. `NEXT_TELEMETRY_DISABLED` at workflow level. Firefox / WebKit stay in the config for local runs only.
- **10c — Deploy gate.** `deploy.yml`: `on.push` replaced by `workflow_run` (workflows `[CI]`, `types: [completed]`, `branches: [main]`); the `image` job runs only when `conclusion == 'success'` and the triggering event was a `push` (PR build-only and `workflow_dispatch` stay unconditional — manual is the emergency bypass); `env.SHA = workflow_run.head_sha || github.sha` pins the checkout `ref` and the `sha-<12>` tag to the commit CI validated, not the tip of `main`. Docs: `DEPLOY.md` §2 / §4 / §6 / §9, `APP_ARCHITECTURE.md` §12, this file (baseline + CI line), `HANDOFF.md`.

**Measured:**
- PR #42 CI: `validate` 1 m 28 s (drift step 1 s), `e2e` 1 m 32 s — **67 pass / 1 skip** in 21.9 s; re-run once as a flake check: 67 / 1 in 19.4 s. CI wall time 1 m 32 s with both jobs in parallel (was 1 m 03 s with one job).
- First gated rollout (the merge commit `eb7cc97`): merge 18:13:06 UTC → CI green 18:14:44 → Deploy run created 18:14:46 (`event: workflow_run`, checkout log `HEAD is now at eb7cc97`) → image 2 m 03 s → rollout 18 s → live 18:17:19: **4 m 13 s merge → live** (was ≈ 2 m 45 s with the ungated parallel deploy). Production after: `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`, `day-200` `200` in 0.27 s.

**Deviations from the plan:** none in substance. The plan estimated ≈ 6 min merge → live; measured 4 m 13 s, because the e2e job is faster than estimated (Playwright ≈ 20 s on the runner against the prerendered pages).

**Gates:** local drift check green on the committed tree and red on a deliberately stale pair (both directions verified, tree restored); both workflow files parsed with js-yaml; PR CI both jobs green twice; `deploy.yml` build-only run green on the PR; first `workflow_run` rollout green; Računi untouched (no `deploy/` change). Plan archived to `docs/archive/phases/PHASE_10_PLAN.md`.

## Phase 9 — Corpus out of the client bundle + 366 prerendered pages (2026-09-28): done (PR #40, `6a0a533`, live)

Review P1 items 6 + 7 as one phase, planned in `docs/archive/phases/PHASE_9_PLAN.md` (eight locked decisions; owner sign-off 2026-09-28, "idemo") and built, merged and deployed the same day. Four commits, each green on its own. A delivery-shape phase: same pages, same pixels, same JSON on disk — different packaging.

**What changed:**
- **9a — Article slot.** `LessonReader` takes `article: ReactNode`; the lesson page renders `LessonBody` + `LessonSources` + `LessonTrustLine` as server components and hands the node to the client reader. The body no longer travels as a `content[]` prop (it existed three times before: chunk, RSC prop, HTML).
- **9b — The split.** `packages/content/src/types.ts`: `LESSON_ARTICLE_KEYS` and, derived from it, `LessonArticle` (`Pick`), `LessonSummary` (`Omit`) and `LessonHeading` (summary + `subtitle` / `dateLabel`, for the open lesson's header). `Lesson`, the JSON files, the loader and the validator are unchanged. `pnpm gen-content` writes `_generated.ts` (summaries, 125 kB) and `_generated.articles.ts` (`Record<LessonId, LessonArticle>`, 2.4 MB) from one load. New entry `@learn365/content/server` (`import 'server-only'`, `getLessonArticle`); `server-only` is the package's one dependency; vitest aliases it to a stub as `apps/web` does. Registry return types narrow to `LessonSummary`; type-only swaps in `core` navigation and in `ui-web` (`CourseSidebar`, `SectionAccordion`, `LessonNavItem` → `LessonSummary`; `LessonHeader`, `LessonReader` → `LessonHeading`). `AppProviders` / `AuthProvider` / `CloudSync` take `courseIds` from the root layout, so the layout's client graph imports no content. `JumpToDay` deleted (no call site; the only value import of content in `ui-web`). `sitemap.ts` reads `lastReviewedAt` through the server entry. `**/_generated*.ts` added to the shared ESLint ignores (nothing ignored them before). Registry tests cover the split (26 tests).
- **9c — Prerender.** `generateStaticParams` + `dynamicParams = false` on `course/[courseId]` and `course/[courseId]/lesson/[lessonId]`.
- **9d — Budget + docs.** `apps/web/scripts/bundle-size.mjs` (`pnpm --filter @learn365/web check-bundle`, a CI step after Build): fails when a route exceeds 175 kB gzip or a chunk 300 kB raw. Docs: this file, `HANDOFF.md`, `APP_ARCHITECTURE.md` §3 / §4 / §8, `CONTENT_MODEL.md` (runtime split), `DEPLOY.md` §12.

**Measured (local production build, 2026-09-28):** client JS per route 100–141 kB gzip (was 933–945; chunk `138` with the corpus, 2,357 kB raw / 824 kB gzip, is gone; the navigation index is chunk `734`, 91 kB raw / 15 kB gzip; `/privatnost` 115 kB gzip). `next build`: 375 static pages; `prerender-manifest.json` 373 routes (366 course / lesson; both dynamic routes `fallback: false`); 366 HTML files under `.next/server/app/course`; a Day 200 sentence is found in exactly `day-200.html` and in no client chunk. `next start`: course + lesson `200` with `cache-control: s-maxage=31536000`, `x-nextjs-cache: HIT`; `day-999`, `/course/nema`, `/course/nema/lesson/day-001` → `404`; `/nalog` stays dynamic (`307`, `private, no-store`).

**Deviations from the plan:** route budget 175 kB gzip instead of 150 — the lesson route measures 141 kB (the plan's 118 kB estimate left out the pages' own chunks) and the point of the budget is a ceiling with ~25 % headroom. Nothing else deviated; `server-only` inside the transpiled workspace package behaves exactly as in `apps/web/lib/server` (verified by importing the server entry from `LessonPageClient` once on purpose and watching `next build` refuse it).

**Gates:** `pnpm typecheck` + `test` (content 26, core 67, ui-web 31, web 75) + `build` + `validate-content` green; `pnpm lint` green outside the git-ignored `apps/web/.data/ui-check.mjs`; `pnpm gen-content` idempotent on the committed tree; `pnpm install --frozen-lockfile` green with pnpm 9.15.0. Playwright (Chromium desktop + mobile, accounts off): **67 pass / 1 documented skip**, run after 9b and again after 9c against `next start` (i.e. against the prerendered pages). CI on the PR green in 1m27s including the new budget step.

**Live (2026-09-28, deploy run for `6a0a533` green — image + rollout):** `/course/istorija-srbije-365/lesson/day-200` answers `200` with `x-nextjs-cache: HIT` and `cf-cache-status: DYNAMIC` (Cloudflare leaves HTML alone, as intended), the body sentence is in the HTML; `day-999`, `/course/nema`, `/course/nema/lesson/day-001` → `404`; `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`. The lesson page's JS as transferred through Cloudflare: 184 kB compressed across 14 chunks, all `cf-cache-status: HIT`, of which 40 kB is the `noModule` polyfills chunk modern browsers skip — ≈ 146 kB for a modern browser, against ≈ 970 kB before. Plan archived to `docs/archive/phases/PHASE_9_PLAN.md`.

## Phase 8 — Accounts + cloud progress: Google sign-in, Postgres, sync beside the local stores (2026-09-27): done (PR #34, `06e6a55`, live)

Owner direction 2026-09-27 ("idemo"), built the same day on `feat/phase-8-accounts` from the plan in `docs/archive/phases/PHASE_8_PLAN.md`. Four code commits, each leaving auth-off behaviour identical, so the merge is a dark deploy; the owner turns the feature on by filling `/srv/learn365/.env` (DEPLOY.md §10).

**What changed:**
- **8a — Database.** `db` service in the `learn365` compose project (postgres:17-alpine, 256 MB cap, named volume, no port), explicit env mappings for `web`, `deploy/backup.sh` + `.env.example`. `apps/web/lib/server/db`: Drizzle schema (`users`, `sessions`, `course_progress`, `lesson_completions`, `bookmarks`, everything cascading from `users`), driver switch by URL scheme (postgres.js in production, PGlite on the laptop and in Vitest — the dev machine has no Docker), migrations generated by drizzle-kit and applied at server start from `instrumentation.ts`. `GET /api/health` reports `auth` + `db`; the image healthcheck stays `GET /` so reading never depends on the database.
- **8b — Google sign-in.** Authorization code + PKCE written directly against Google's endpoints (the plan's `arctic` is deprecated on npm): state + verifier in a 10-minute cookie, ID-token claims checked, user upserted by Google `sub`, no Google tokens stored. Sessions: 256-bit token in `l365_session` (HttpOnly, Lax, Secure on https), SHA-256 at rest, 30 days sliding. `Origin` check on every mutating route; `return_to` limited to same-origin paths. Routes `/api/auth/google`, `…/callback`, `/api/auth/signout`, `/api/me` (GET, DELETE). Pages `/prijava`, `/nalog`, `/privatnost`; Footer gains `Privatnost`; how-it-works step 2 now says progress also travels with a Google account. Client: `AuthProvider` asks `/api/me` once per full load; TopBar `account` slot (loading placeholder → `Prijava` link / `AccountMark`); sign-out clears both local stores and the account keys **after** the sync layer has been disposed.
- **8c — Progress sync + the ask.** `@learn365/core`: `CourseProgressSnapshot`, `replaceCourseProgress`, `mergeCourseProgress` (union; last-opened from the newer side), `sync/` helpers. Server: `/api/me/progress` (GET, PATCH delta), `/api/me/progress/sync` (POST union); unknown lesson ids are dropped and counted, never a failure. Client: a generic engine (`apps/web/lib/sync/syncEngine.ts`) — first contact per (browser, user) = POST sync + marker, later loads = GET replace, coalesced PATCH deltas with one retry, in-flight changes re-applied, disposed on sign-out — plus a progress adapter; `CloudSync` mounts it while signed in. The ask: `SignInPrompt` card between the completion moment and the next-lesson card once ≥ 2 lessons are done, accounts are on, nobody is signed in and `Ne sada` (remembered in `localStorage`) was not pressed. Never a modal; the first-win moment is untouched.
- **8d — Bookmarks sync.** `/api/me/bookmarks` (+ `/sync`), repository, bookmark adapter on the same engine.

**Deviations from the plan:** no OAuth library (deprecated); TopBar takes a structured `account` prop rather than a ReactNode slot (keeps the mobile icon-only rule in one stylesheet); one generic sync engine with two adapters instead of two engines; per-store cloud markers (`learn365:cloud:progress:v1`, `learn365:cloud:bookmarks:v1`).

**Files touched (by area):** `apps/web/lib/server/{env,http}.ts`, `lib/server/{db,auth,progress,bookmarks}/`, `app/api/{health,auth,me}/`, `app/(account)/`, `app/privatnost/`, `lib/auth/`, `lib/sync/`, `instrumentation.ts`, `drizzle.config.ts`, `next.config.mjs`, `Dockerfile`, `vitest.config.ts`, `test/`, `.env.example`; `packages/core/src/{progress,bookmarks,sync}/`; `packages/ui-web/src/{icons/IconUser,primitives/AccountMark,primitives/TopBar,primitives/Footer,lesson/SignInPrompt,lesson/CompletedFooter,lesson/LessonReader}`; `deploy/{docker-compose.yml,.env.example,backup.sh}`; `docs/{DEPLOY,BACKEND_STRATEGY,PHASE_8_PLAN}.md`.

**Gates:** `pnpm typecheck` + `lint` + `test` + `build` green (core 67 tests, web 69, ui-web 31). Playwright (Chromium desktop + mobile, accounts off): **61 pass / 1 documented skip**, including the new `e2e/auth-off.spec.ts` (no account entry, `/prijava` unavailable state, `/nalog` redirect, no ask after two completions, `/privatnost`). Manual verification against a local `next start` with accounts on and a seeded session: every route's 200/204/302/400/401/403 path, union sync, un-completion, account deletion cascade; and a Chromium walk of the signed-in flow (first-contact sync, PATCH on `Završi`, GET on reload, sign-out clearing without a stray delta, the ask + `Ne sada`).

**Go-live (2026-09-27, same day):** Google Cloud project `istorija365` (consent screen published, OAuth client with the production redirect URI); VPS `.env` filled, `learn365-db` started (postgres:17-alpine, volume `learn365-pgdata`), `web` recreated, migrations applied on Postgres in 62 ms, public `/api/health` = `{"ok":true,"auth":true,"db":"ok"}`, nightly `backup.sh` in `deploy`'s crontab with a first 12 KB dump, Računi containers unchanged, RAM free 2.4 GB. **Closed 2026-09-27:** `www` → apex 301 in Cloudflare; the owner's manual QA on production passed (the ask after the second lesson, sign-in, second device, un-completion, bookmarks, sign-out / re-sign-in). Follow-ups: off-box backups, a persistent client outbox, rotating the Google client secret. Plan archived to `docs/archive/phases/PHASE_8_PLAN.md`.

## Fix — Review P0 (2026-09-28): done (PRs #37, #38)

The P0 group of [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md), worked in order at the owner's request ("ajmo redom"). Item 1 (rotate the Google client secret, `chmod 600 .env`) was skipped by owner decision. Item 2 was resolved with the owner on 2026-09-28: there is no mailbox and no company, and the lessons were AI-prepared — so the copy now says exactly that.

**What changed (four commits, each shippable alone):**
- **Sync — no cross-account union (`01ed69f`).** `apps/web/lib/sync/syncEngine.ts`: the `POST …/sync` union runs only when the browser carries no cloud marker at all; a marker naming a *different* user takes the `GET`-replace path and is rewritten after a successful load (two new tests). `apps/web/lib/auth/AuthProvider.tsx` + new `implicitSignOut.ts`: when `/api/me` answers `enabled: true, user: null` while a marker exists, the local stores and account keys are cleared without navigating (an *implicit* sign-out — expiry, cleared cookie, account deleted elsewhere); `enabled: false` never clears anything, so a database outage cannot wipe a local copy. Privacy copy gained one sentence on what an expired session means locally.
- **Content — five slips (`9f9fd34`).** Day 7: the Vasić citation now names his real 1932 volume (`Preistoriska Vinča I`) and the sentence repeated verbatim at the end is gone; Day 106: Pločnik is Lazar's victory and Bileća 1388 Tvrtko's; Day 200: `proté` → `prote`; Day 231: the 1842 assembly sat on Vračar; Day 250: Serbia was the *third* Balkan kingdom. `_generated.ts` regenerated.
- **Contact, controller, honest About (fourth commit).** `CONTACT_EMAIL` = `kontakt@istorija365.com`, wired in Cloudflare Email Routing and verified with a test mail on 2026-09-28 (`DEPLOY.md` §11). `/privatnost` gains a first section "Ko vodi sajt" (a private individual is the *rukovalac*), names Cloudflare and Google in "Gde i koliko dugo", and says deleted data leaves backups within fourteen days. `/o-aplikaciji`: "Urednički tim / Tim History 365" is replaced by "Ko stoji iza kursa" — one person, AI-prepared texts, edited and corrected lesson by lesson; the "every text passes editorial review" claim is gone; *vi* forms switched to *ti*. `first-impression.spec.ts` asserts the old team name is absent and the mailto uses the production domain.
- **SEO — canonical, sitemap, robots (`4b8335a`).** `shareMetadata()` emits `alternates.canonical`; `app/sitemap.ts` (369 URLs) and `app/robots.ts` added; `SITE_URL` falls back to the production origin so the leftover Vercel build points at istorija365.com; new `e2e/seo.spec.ts`; `DEPLOY.md` §2/§8 updated.

**Gates:** `tsc --noEmit` green; `eslint app lib components` green (`eslint .` fails locally only on the git-ignored `apps/web/.data/ui-check.mjs`, an untracked scratch file); vitest web: sync engine 9/9 + implicit sign-out 4/4; `pnpm gen-content` + `validate-content` + content tests green; `next build` green with `/robots.txt` and `/sitemap.xml` static; Playwright chromium-desktop: `seo` + `first-impression` 6/6.

## Polish — Course overview: one affordance per era card, labelled bookmark (2026-09-25): done (unmerged)

Group 4 of the 2026-09-25 product review — the small items that remained after the loop, the first impression and the reader.

**What changed:**
- **Era card = disclosure + one action** (`CourseCard`, `CourseOverviewEras`). The card body is now a `<button aria-expanded>` that opens the era's sections (eyebrow, title, years, description, and a quiet `Pokaži odeljke · N` / `Sakrij odeljke` hint with a rotating chevron); beside the progress bar sits the single explicit link — `Počni →` (nothing read), `Nastavi →` (in progress) or `Pročitano ✓` (era complete) — which opens the era's **first unread lesson**, not blindly its first lesson. The separate standalone `Pokaži odeljke` toggle under each card is gone, so there is no longer a whole-card link competing with a text toggle. Mobile: progress + action share one row under the title.
- **Bookmark toggle is labelled** (`LessonHeader`): `Sačuvaj` / `Sačuvano` next to the ribbon on desktop (icon-only ≤1024px, aria-label unchanged), with a `title` explaining that saved lessons live on the course page — the return surface was otherwise undiscoverable because it renders nothing while empty.
- Already closed by earlier groups: `Poslednji pregled` next to `Izvori` (group 3), "Premium" self-description dropped (group 2), "progress lives in this browser" stated in the how-it-works steps (group 2).

**Files touched:** `packages/ui-web/src/course/CourseCard/CourseCard.tsx` + `.module.css`, `apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx` + `.module.css`, `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` + `.module.css`, `apps/web/e2e/smoke.spec.ts` (era cards are buttons now), `apps/web/e2e/course.spec.ts` (new, 3 tests).

**Gates:** typecheck + lint + test + build green. Playwright (Chromium desktop + mobile): 51 pass / 1 documented skip across `smoke`, `resume`, `first-impression`, `reader`, `course`. Console clean.

## Polish — Reader: first sentence sooner, shorter sticky chrome, strip below the article (2026-09-25): done (unmerged)

Group 3 of the 2026-09-25 product review. The lesson reader on a phone showed five layers of chrome before the first sentence and kept 150px pinned while reading; on desktop the 8-era strip pushed the title to mid-screen; the local date divider's tick labels collided on phones.

**What changed:**
- **Mobile sticky header is one row** (`LessonContextHeader`): `Sadržaj` trigger · `Dan nnn / 365` · `Pročitano nnn / 365`. The era label and the thin bar left the header; the progress count keeps its `metaRow` class so the existing "stays visible while scrolling" e2e probe still holds. Pinned chrome on a 390px phone: 65 + 47 = **112px** (was 150). The label collapses to the icon at ≤380px.
- **Breadcrumbs are desktop-only** (`.breadcrumbs` wrapper hidden ≤1024px). The era now rides in the lesson header eyebrow on single-column layouts (`LessonHeader` gains `eraShort`; `.eraMobile` span hidden on desktop where the breadcrumb + sidebar carry it): `Praistorija i antika · 8 min čitanja · oko 9500–6000. p. n. e.`
- **Trust line moved to the end.** New `LessonTrustLine` (`packages/ui-web/src/lesson/LessonTrustLine/`) renders byline + `POSLEDNJI PREGLED` after `Izvori`, before the footer; `LessonHeader` no longer renders it.
- **Era strip after the article (desktop).** `HistoricalTimeline` moved from above the header to after the footer inside the article; still hidden ≤1024px (reached via the drawer). Title top on 1440×900: **260px** (was 458).
- **`LessonTimeline` on phones:** the five round-year ticks are hidden ≤720px (they cannot fit; they collided into one string) and the divider's margins shrink; the accent marker label alone carries the date. First paragraph top on a 390×844 phone: **526px** (was 738); on 360×780: 542px.
- **Sidebar / drawer era rows use `eraShort`** (`EraGroup`), with the full title as a tooltip — `PRAISTORIJA, ANTIKA I DOSELJAVANJE SLOVENA` no longer wraps to four caps lines in the 300px column.
- The eyebrow clears the top-right bookmark toggle (`padding-right: 48px` ≤1024px) so a wrapped eyebrow never runs under the icon.

**Files touched:** `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx` + `.module.css`, `LessonPageClient.tsx`; `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` + `.module.css`, `LessonHeader/LessonHeader.tsx` + `.module.css`, `LessonTimeline/LessonTimeline.module.css`, `LessonTrustLine/*` (new), `lesson/index.ts`; `packages/ui-web/src/course/EraGroup/EraGroup.tsx`; `apps/web/e2e/reader.spec.ts` (new, 3 tests).

**Gates:** typecheck + lint + test + build green. Playwright (Chromium desktop + mobile): 45 pass / 1 documented skip. Console clean at 1440 / 390 / 360.

## Polish — First impression: how-it-works, one-line hero, share cards, About copy (2026-09-25): done (unmerged)

Group 2 of the 2026-09-25 product review. Everything a first-time visitor (or someone who receives the link) meets before the first lesson.

**What changed:**
- **"Kako funkcioniše" block on Home** (`HomeHowItWorks`, client): eyebrow + `Tri koraka, tvojim tempom.` + three numbered steps (`Otvori lekciju` / `Označi je kao pročitanu` / `Sutra nastavi gde si stao`) + the note that **"Dan" is the lesson's ordinal, not a calendar date** and that skipping a day loses nothing. Renders only while nothing is completed (via `useResumeLesson`), then retires; the identical copy lives permanently on `/o-aplikaciji` (new section between `Misija` and `Urednički standard`). Copy is shared from `apps/web/lib/copy/howItWorks.ts` so the two cannot drift. Step 2 also states that progress is stored in this browser, no account.
- **Hero.** Title is one line from 1100px up (`.heroTitle`: `clamp(56px, 6.3vw, 92px)` + `nowrap`; hero column widened to 960px) — `365` no longer strands on its own line at 1440px. CTA moved directly under the lede (flourish now closes the band after it): CTA bottom at 554px on a 900px viewport (was ~835px), 527px on 720px.
- **Share previews.** New `apps/web/lib/seo/metadata.ts` (`SITE_URL`, `SITE_DESCRIPTION`, `shareMetadata()` building full `openGraph` + `twitter` blocks, since Next does not deep-merge `openGraph`). Root layout sets `metadataBase` + defaults; course page and lesson page gained `generateMetadata` (lesson: `Dan N: <title>` + `summary ?? subtitle`); About sets its own. Static card `apps/web/public/og/istorija-srbije-365.jpg` (1200×630, 54 KB, rendered from a token-matched HTML page with the hero backdrop; source in the session scratchpad, not committed).
- **Copy honesty.** `O aplikaciji`: `O izvorima` no longer claims lessons carry no bibliography (six lessons, Day 1 included, render `Izvori`); `Urednički tim` no longer says the course is still being built (all 365 exist). The site description, About description and Footer tagline drop the self-applied "Premium".

**Files touched:** `apps/web/lib/copy/howItWorks.ts` (new), `apps/web/lib/seo/metadata.ts` (new), `apps/web/app/_components/HomeHowItWorks.tsx` (new), `apps/web/app/page.tsx` + `page.module.css`, `apps/web/app/layout.tsx`, `apps/web/app/course/[courseId]/page.tsx`, `apps/web/app/course/[courseId]/lesson/[lessonId]/page.tsx`, `apps/web/app/o-aplikaciji/_copy.ts` + `page.tsx` + `page.module.css`, `packages/ui-web/src/primitives/Footer/Footer.tsx`, `apps/web/public/og/istorija-srbije-365.jpg` (new), `apps/web/e2e/first-impression.spec.ts` (new, 3 tests).

**Gates:** typecheck + lint + test + build green. Playwright (Chromium desktop + mobile): 39 pass / 1 documented skip. Console clean on Home at 1440 / 1280 / 390.

**Still open from this group:** `CONTACT_EMAIL` remains a placeholder — needs the real address from the owner.

## Polish — Core loop: resume rule, first-win moment, course start state (2026-09-25): done (unmerged)

First item of the 2026-09-25 product review ("what stops this being 10/10 for someone opening it for the first time"). Three defects in the daily loop, fixed in one pass. Product assumption carried from the review: **"Dan" is a sequence number, not a calendar date** — the reader moves at their own pace.

**What changed:**
- **One resume rule.** New pure helper `findResumeLesson(lessons, completedIds, lastOpenedLessonId)` in `@learn365/core/navigation`: returns `lastOpened` only if it is a real, *unfinished* lesson; otherwise the first lesson not completed; `null` once the course is complete. New `apps/web/lib/progress/useResumeLesson.ts` wraps it for the web app (fresh user → Day 1; started → resume target; exposes `completed`, `total`, `hasStarted`). `HomeHeroCta`, `HomeCurrentLessonCard` and `CourseOverviewProgress` all consume the hook — the three previous independent copies of "last opened lesson" logic are gone. Closes the day-2 trap: finishing Day 1 used to leave every "Nastavi" action pointing back at Day 1.
- **First-win moment.** `CompletedFooter` takes `completedCount` + `totalLessons` and renders one serif sentence (`Prvi dan je iza tebe.` on the first completion, `Dan N je iza tebe.` after) with `Pročitano N / 365` beneath, above the existing next-lesson card. `LessonReader` (now `'use client'`) scrolls the moment + card into view on the false→true completion edge only, `prefers-reduced-motion` aware.
- **Course card start state.** `CourseProgress` with `journeyDayLabel === null` renders no ring and no `0%`: eyebrow `ZAPOČNI · DAN 001`, lesson title, reading time, and a primary pill `Počni od Dana 1 →` (same pill vocabulary as the Home hero CTA). In progress, the ring centre counts lessons (`1` / `od 365`) instead of a percent that rounds the first win down to `0%`; the row gains `DAN nnn · n min čitanja` meta, a `Nastavi →` action and a 2-line title clamp. `ProgressRing` is now CSS-sized (`--ring-size`, 120px default, 88px at ≤720px) and accepts an accessible `label`.
- **One word for progress.** TopBar capsule label `Ukupno` → `Pročitano` (aria-label `Pročitane lekcije`), matching the mobile `LessonContextHeader`. The label stays visible at ≤720px (10px / 0.08em tracking); the decorative mini-bar drops there instead of at ≤460px. No horizontal overflow at 360px.

**Files touched:**
- `packages/core/src/navigation/index.ts` (+ `navigation.test.ts`, 6 new tests) — `findResumeLesson`.
- `apps/web/lib/progress/useResumeLesson.ts` — new shared hook.
- `apps/web/app/_components/HomeHeroCta.tsx`, `HomeCurrentLessonCard.tsx`, `apps/web/app/course/[courseId]/_components/CourseOverviewProgress.tsx` — consume the hook.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — passes `completedCount` / `totalLessons` to the reader.
- `packages/ui-web/src/course/CourseProgress/*` — start + in-progress states.
- `packages/ui-web/src/primitives/ProgressRing/*` — CSS-sized box, `label` prop.
- `packages/ui-web/src/primitives/TopBar/TopBar.tsx` + `.module.css` — label + mobile rules.
- `packages/ui-web/src/lesson/CompletedFooter/*`, `packages/ui-web/src/lesson/LessonReader/*` — moment + scroll.
- `apps/web/e2e/resume.spec.ts` — new (5 tests).

**Gates:** `pnpm typecheck` + `lint` + `test` (core 55 tests incl. the 6 new) + `build` green. Playwright on `chromium-desktop` + `chromium-mobile`: 33 pass / 1 documented skip. Firefox/WebKit profiles not run locally (browsers not installed on the dev machine).

**Carry-forward:** the rest of the 2026-09-25 review — see HANDOFF → "Product review backlog (2026-09-25)".

## Polish — Mobile lesson context header always visible (2026-05-21): done

Owner-requested correction to the mobile lesson reading screen. The Phase 7.5 behavior — the sticky `LessonContextHeader`'s secondary meta row (era + `Pročitano nnn / 365` progress) collapsing on scroll-down and restoring on scroll-up — read as distracting and inconsistent. The owner wants the whole lesson progress/navigation area to stay visible at all times while scrolling.

**What changed:**
- **The meta row no longer collapses.** The full context header (top row: `Sadržaj` trigger + `Dan nnn / 365`; meta row: era label + thin progress bar + `Pročitano nnn / 365`) now stays fully visible while scrolling. The header was already `position: sticky` under the TopBar, so it simply remains pinned — no scroll-direction state, no show/hide. This effectively reverts the Phase 7.5 collapse while keeping everything else 7.5 established (the sticky positioning, the labeled progress, the single day indicator).
- **No regression to the duplicate pill.** The unlabeled top-right `nn / 365` pill removed in the earlier de-duplication polish stays gone; the only progress count on the lesson view remains the labeled `Pročitano nnn / 365` in the meta row.
- **Simpler, calmer, less code.** Removing the scroll listener removes the only source of motion/jumpiness in this chrome and deletes a client hook. Desktop is untouched (the whole header is `display: none` on the two-column layout).

**Files touched:**
- `apps/web/app/course/[courseId]/lesson/[lessonId]/useScrollDirection.ts` — **deleted** (the `useMetaRowCollapsed()` hook is no longer used anywhere).
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx` — drops the hook import, the `collapsed` state, the `collapsed` class toggle on the root, and `aria-hidden={collapsed}` on the meta row; doc comment updated to "always visible."
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.module.css` — removed the `.metaRow` `max-height`/`opacity`/`margin-top` collapse transition, the `.collapsed .metaRow` rule, and the now-moot `prefers-reduced-motion` override for that transition. `.metaRow` is now a plain always-shown flex row.
- `apps/web/e2e/smoke.spec.ts` — the meta-row test was rewritten: instead of asserting the row collapses to 0 height on scroll-down, it now scrolls down and asserts the row **stays** visible (height > 0) with the contents trigger reachable. Still skips on the desktop two-column profiles. Passes on `chromium-mobile` + `webkit-mobile`.

No content/schema/`_generated.ts` change, no `Breadcrumbs` or other primitive API change. Gates: `pnpm --filter web typecheck` + `lint` + `build` green; the rewritten e2e meta-row test passes on both mobile profiles.

**Carry-forward note:** the post-7.5 "scrolled-state screenshot" deferral (a baseline capture of the collapsed meta row) is now moot — there is no collapsed state to capture. The post-7.5 screen-reader sub-item about the `aria-hidden`-while-collapsed meta row is likewise moot (the row is always present, never `aria-hidden`).

## Polish — Mobile lesson top-hierarchy de-duplication (2026-05-21): done

Owner-requested cleanup of the mobile lesson screen's top information hierarchy. The day position and the progress count each appeared in more than one place, making the chrome read busy rather than premium.

**What changed:**
- **Day shown once.** The single day indicator lives in the sticky `LessonContextHeader` top row. Its trailing breadcrumb crumb (`DAN nnn`, added in Phase 7.3) was removed, so the breadcrumb is now location hierarchy only — `Početna · Course · Era · Section`. Desktop loses nothing: the always-visible sidebar still highlights the active `Dnnn` row (`aria-current="page"`), so day context is preserved there; mobile carries it in the context header.
- **Progress labeled once.** The meta row's bare `nnn / 365` count is now `Pročitano nnn / 365` — a clear, human-readable label instead of an unlabeled fraction next to the bar.
- **Calmer day label.** The indicator reads `Dan nnn / 365` (title case) rather than the all-caps `DAN nnn`, per the owner's wording. **Note:** this diverges from the cross-surface `DAN nnn` / `Dnnn` identifier convention (`CourseProgress`, `LessonNavItem`, `PreviousNextLessonNavigation`, the post-completion footer) normalised earlier — flagged for the owner; revert to `DAN` in one line if system consistency is preferred.

**Files touched:**
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx` — `DAN` → `Dan`; progress meta gains the `Pročitano` label.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — drops the trailing `DAN nnn` breadcrumb crumb (and its `lesson.dayNumber` dep).
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` — eyebrow comment corrected (the breadcrumb no longer carries the day).
- `apps/web/e2e/smoke.spec.ts` — the "shows day" assertion is now layout-aware: matches `Dan 001` (mobile context header) or `D001` (desktop sidebar active row), since the day is no longer a breadcrumb crumb.

No content/schema/`_generated.ts` change, no `Breadcrumbs` primitive API change. Gates: `pnpm typecheck` + `pnpm lint` green.

## Polish — Mobile lesson progress de-duplication + editorial timeline divider (2026-05-21): done

Owner-requested follow-up to the top-hierarchy cleanup above. Two parts:

**1 — Course progress shown once on the lesson page.** The global `TopBar`'s total-progress capsule (`Ukupno X / 365`, which collapses to a bare `X / 365` at ≤720px) duplicated the labelled `Pročitano X / 365` carried by the sticky `LessonContextHeader`. The capsule is now hidden **only on the `lesson` route at ≤1024px** (the single-column range where the context header is visible) via a `data-route` attribute + a scoped media query. It stays on Home / Course / About at all widths, and on the desktop (>1024px) lesson layout where there is no context header. So course progress now appears exactly once per lesson view, always labelled. The separate `Dan nnn / 365` current-lesson indicator is untouched.

**2 — Editorial timeline divider replaces the decorative flourish.** Below the lesson title/subtitle, authored lessons now render a new `LessonTimeline` component instead of the `<Flourish/>` (line · ✦ · line). It reads first as a divider — a hairline rule in `var(--rule)` — but quietly orients the reader in historical time: 5 round year ticks below the rule and one stylised accent (`var(--accent)`, dark green) marker above it (slim stem + small diamond cap, not a literal map pin) carrying the lesson's `dateLabel` (e.g. `15. vek`). The scale is intentionally *approximate*, not globally proportional: a pure helper (`lessonTimelineScale.ts`) picks a round step by magnitude (100 / 1000 / 2000 yrs), builds a local 5-tick window centred on the lesson year (soft-capped so it never trails far past the present), and returns the marker %. Informational only — `aria-hidden`, no roles or tab stops (the date is already announced by the header eyebrow). **Placeholder lessons fall back to `<Flourish/>`** — their interpolated year isn't a real fact yet. No content/schema change; reuses existing `lesson.year` + `lesson.dateLabel`.

**Files touched:**
- `packages/ui-web/src/primitives/TopBar/TopBar.tsx` + `.module.css` — `data-route` on the progress capsule; `@media (max-width: 1024px) .progressGroup[data-route='lesson'] { display: none }`.
- `packages/ui-web/src/lesson/LessonTimeline/` — new: `LessonTimeline.tsx`, `.module.css`, `lessonTimelineScale.ts` (+ `lessonTimelineScale.test.ts`, 8 tests), `index.ts`.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` — authored lessons render `<LessonTimeline/>`; placeholders keep `<Flourish/>`.
- `packages/ui-web/src/lesson/index.ts` — exports `LessonTimeline`.

Gates: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` (29 tests, incl. 8 new) all green. Manual mobile-width visual QA still recommended on the Vercel preview.

## Phase 5 — Web polish + QA: done

All engineering gates closed; cross-browser visual review passed manually on Chrome / Firefox / Safari on Windows. Skip link (`Preskoči na sadržaj`) is the first tab stop and targets `<main id="main-content" tabIndex={-1}>`; Home hero CTA + course-overview start link have explicit `:focus-visible` accent rings; `MobileLessonDrawer` backdrop demoted to an `aria-hidden` `<div>` (no longer in the Tab cycle) and initial focus routed to the close button. Playwright suite is wired with **6 tests × 5 browser profiles (chromium-desktop, firefox-desktop, webkit-desktop, chromium-mobile, webkit-mobile) = 30 runs, 28 pass / 2 skipped** (the 2 skips are documented WebKit Tab-skips-anchors quirk on the skip-link assertion only). The suite covers: hero/CTA visible, 8 era cards on overview, mark-completed toggles label, completion persists across reload, skip-link tab-to-Enter path, and a `prefers-reduced-motion` assertion that confirms the timeline marker's transition collapses to <1ms when the OS preference is set. Lighthouse scores against `next start` (lighthouse@12 desktop preset + default mobile preset):

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
8. **Backend stack**: *(superseded 2026-09-27)* first planned as .NET 9 Web API + SQL Server; shipped in Phase 8 as Next.js route handlers under `apps/web/app/api/**` + PostgreSQL 17 via Drizzle, with a sync layer beside the unchanged `ProgressStorage` adapter (`docs/BACKEND_STRATEGY.md`).

## Documentation foundation

Created in this commit set:

- `docs/IMPLEMENTATION_PLAN.md` — canonical plan
- `docs/APP_ARCHITECTURE.md` — monorepo, packages, dependency rules, data flow
- `docs/DESIGN_SYSTEM.md` — tokens, typography, Editorial theme, OKLCH strategy
- `docs/COMPONENT_LIBRARY.md` — every shared component, prop contracts, states, a11y
- `docs/QA_CHECKLIST.md` — phase-end regression checks
- `docs/CONTENT_AUTHORING.md` — how to add a lesson, MDX migration path
- `docs/MOBILE_NOTES.md` — planning doc for future Expo app (no code yet)
- `docs/BACKEND_STRATEGY.md` — the backend as built in Phase 8 (Next.js route handlers + PostgreSQL; the original .NET 9 + SQL Server plan was superseded on 2026-09-27)

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

- `.github/workflows/ci.yml` — runs on PRs and pushes to `main`; pnpm + Node via `.nvmrc`; two parallel jobs (post-Phase 10): `validate` = `install → validate-content → gen-content drift check → lint → typecheck → test → build → bundle budget`, `e2e` = `install → chromium → build → playwright (chromium-desktop + chromium-mobile)`. `deploy.yml` starts only from a green CI on `main` (`workflow_run`).

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

A focused UX pass on the lesson reader, triggered by a review of the live mobile build: the full `HistoricalTimeline` rendered inline between the breadcrumbs and the lesson header, so on phones a vertical 8-row block pushed the lesson title far down — the page read as a navigation screen, not a reading view. The lesson page is primarily for reading; the timeline is context, so it should be available but not dominate the first screen. Plan in `docs/archive/phases/PHASE_6_7_MOBILE_LESSON_CONTEXT.md`. Engineering gates all green: typecheck, lint, **79 unit tests**, production build (5 routes), `validate-content` (365/28/8), and Playwright **8 tests × 5 profiles = 40 runs, 38 pass / 2 skipped** (the 2 skips are the documented WebKit Tab-skips-anchors quirk).

**Decisions (2026-05-15, with the product owner):** (1) the mobile "Sadržaj" drawer holds **both** a compact timeline + the course outline — one unified navigation surface; (2) the swap is tied to the **layout** breakpoint (≤1024px, single column), not the device — single column ⇒ compact header + drawer, two-column desktop ⇒ unchanged.

Changes:

- **Inline timeline is desktop-only.** `LessonReader` wraps `<HistoricalTimeline>` in a `.timelineInline` div that is `display:none` at ≤1024px — which also drops it from the a11y tree, so there is no duplicate `nav` landmark. Desktop (>1024px) is visually unchanged: left `CourseSidebar` column + the inline horizontal journey rail.
- **New `LessonContextHeader`** (`apps/web`, colocated with the lesson route — consistent with the Phase 4 precedent of keeping the mobile course-outline trigger in the lesson page). Replaces the old thin `.mobileBar`. A calm two-row sticky bar shown only ≤1024px: row 1 — back link (→ course overview) · `DAN 001 / 365` · "Sadržaj" button; row 2 — current era label · thin `ProgressBar` + `1 / 365`. On ≤380px the back link collapses to a bare chevron.
- **Lesson title surfaces immediately.** With the inline timeline gone on mobile, `LessonHeader` (title + subtitle) now sits right after the breadcrumbs — the reading experience starts on the first screen.
- **Eyebrow de-duplicated.** `LessonHeader`'s eyebrow was one joined string; it's now split so the leading `DAN nnn · era` group (`.eyebrowContext`) is `display:none` at ≤1024px — the sticky context header already carries those. Reading time + year stay (the context header doesn't show them).
- **"Sadržaj" drawer = compact timeline + course outline.** `MobileLessonDrawer` children went from a bare `<CourseSidebar>` to a `.drawerContents` flex column: a `VREMENSKA OSA`-kickered compact `HistoricalTimeline` pinned at the top (bounded to `38vh`, scrolls), with the scrollable `CourseSidebar` outline filling the rest. Drawer `ariaLabel` default updated to "Sadržaj i vremenska osa".
- **`HistoricalTimeline` gained `variant?: 'full' | 'compact'`** (default `'full'`, backward-compatible — `HomeEraTimeline` and the desktop reader are untouched). `'compact'` forces the condensed vertical journey-rail layout at *every* viewport (the drawer is ~360px wide but can be open up to 1024px, so it can't rely on the `≤720px` media query) with lighter chrome — it already sits on the drawer surface.
- **e2e** — the "lesson reader shows day, sidebar, timeline" test is now layout-aware: on single-column profiles it opens the "Sadržaj" drawer, asserts the timeline is visible, then closes it; on desktop it asserts the inline timeline directly.

Files touched — `packages/ui-web/src/lesson/{LessonReader/LessonReader.tsx,LessonReader/LessonReader.module.css,LessonHeader/LessonHeader.tsx,LessonHeader/LessonHeader.module.css,HistoricalTimeline/HistoricalTimeline.tsx,HistoricalTimeline/HistoricalTimeline.module.css,MobileLessonDrawer/MobileLessonDrawer.tsx}`; `apps/web/app/course/[courseId]/lesson/[lessonId]/{LessonContextHeader.tsx,LessonContextHeader.module.css}` (new), `.../LessonPageClient.tsx`, `.../LessonPageClient.module.css`; `apps/web/e2e/smoke.spec.ts`; `docs/archive/phases/PHASE_6_7_MOBILE_LESSON_CONTEXT.md` (new at the time; later moved to archive).

## Phase 6.8 — Decluttering & navigation polish: done

Driven by the 2026-05-15 UX review (`docs/archive/reviews/UX_REVIEW_2026-05-15.md`) and its
implementation plan (`docs/archive/phases/PHASE_6_8_DECLUTTER_PLAN.md`). All 5 review bundles
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

## Phase 6.9 — Hero declutter + lesson toolbar swap + upcoming polish: done

A focused UX cleanup pass triggered by a 2026-05-15 review of the live build.
No architecture, routing, content model, or progress changes. Engineering
gates all green: typecheck (6 packages), lint (5 packages), **79 unit tests**
(content 24 / core 27 / ui-web 21 / ui 7), production build (5 routes; lesson
route 1.82 → 1.79 kB after the toolbar simplification), `validate-content`
(365/28/8).

### Course overview — JumpToDay relocated out of the page hero

`JumpToDay` moved from the page `.header` (eyebrow + h1 + start link + jump
form) to the eras-section header, where it sits beside the "Sadržaj" title.
It now reads as a quiet utility that belongs with the era/lesson tree the
user is actually scanning, not as a hero-level affordance. The page header
collapses to the three editorial elements: `Kurs` eyebrow · title · "Počni
od Dana 001 →". `.erasHeader` became a flex row (title block left, jump
utility right) with a sensible wrap to full-width on ≤720px.

### Lesson toolbar — `Sadržaj` on the LEFT, `Nazad` removed

`LessonContextHeader` top row swapped to match the drawer it controls: the
drawer slides in from the left, so the trigger sits on the left now. New
layout uses `grid-template-columns: 1fr auto 1fr` so the day label stays
perfectly centered with a single control on the left and an empty spacer
on the right.

- Left: `☰ Sadržaj` button
- Center: `DAN nnn / 365`
- Right: empty grid cell (spacer)

The "Nazad" link is gone. Redundant on the lesson page — the sticky `TopBar`
already carries a `Kurs` nav link, the `Breadcrumbs` above the article carry
`Početna · Kurs · Era`, and the browser/PWA back gesture still works.
`LessonContextHeader`'s `backHref` prop was dropped along with the now-unused
`IconArrowLeft` import; `LessonPageClient` stopped passing the prop.

The narrow-viewport rule at ≤380px now collapses the contents-button label
to its icon only (was: the back-link label).

### Drawer behavior — unchanged

Already slides in from the left (`MobileLessonDrawer` `slideIn` keyframe
`translateX(-100%) → 0`). The Part 2 swap puts the trigger on the left, so
trigger and drawer direction are now visually + behaviorally aligned. No
code change needed.

### Unavailable lessons — explicit "Uskoro" chip + intentional page state

- **`LessonNavItem`** now renders an `Uskoro` pill chip in place of the
  reading-time meta when `lesson.isPlaceholder === true`. The chip is a
  hairline pill (`var(--rule-2)` border, transparent fill, `var(--muted)`
  text) — quiet enough to fit the editorial identity, explicit enough that
  the user can scan which days actually have content before opening.
  On `.state_active` rows the chip's border and label lift to `--ink-2` so
  it stays legible on the accent-soft backdrop.
- **`LessonReader` upcoming state** gained an explicit `Uskoro` eyebrow + a
  refined message: "Ova lekcija je u pripremi." with a calm note explaining
  that the course populates progressively. Reads as intentional editorial
  placeholder, not a broken page. The container is now `role="status"` so
  the state is announced by screen readers when the upcoming page mounts.
- The Playwright placeholder-state assertion updated to the new copy.

Files touched:

- `apps/web/app/course/[courseId]/page.tsx` — `JumpToDay` moved from page
  header into the eras-section header.
- `apps/web/app/course/[courseId]/page.module.css` — `.erasHeader` flex row;
  `.erasHeading` (left) + `.jump` (right) with ≤720px wrap.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx`
  — `Sadržaj` button moved left; `Nazad` link + `backHref` prop +
  `IconArrowLeft` import removed; right grid cell is an empty spacer.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.module.css`
  — top row uses `grid-template-columns: 1fr auto 1fr`; narrow-viewport rule
  collapses the contents-button label, not the (now-absent) back link.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx`
  — stopped passing the obsolete `backHref` prop.
- `packages/ui-web/src/course/LessonNavItem/LessonNavItem.tsx` — placeholder
  rows render an `Uskoro` chip in place of the reading-time meta.
- `packages/ui-web/src/course/LessonNavItem/LessonNavItem.module.css` —
  `.upcomingChip` rule + `.state_active .upcomingChip` lift on accent bg.
- `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` — upcoming
  state gained an `Uskoro` eyebrow + refined copy; container is
  `role="status"`.
- `packages/ui-web/src/lesson/LessonReader/LessonReader.module.css` —
  `.upcomingEyebrow` rule.
- `apps/web/e2e/smoke.spec.ts` — placeholder-state assertion updated.

## Phase 7.1 — Trust polish: done

Three sub-bundles ship inside one PR (7.1a → 7.1b → 7.1c). Closes the
single biggest "is this a real product?" gap — every route now ends with
a calm editorial footer landmark, the brand has an honest about page, and
the TopBar `O aplikaciji` link removed in 7.0d returns as a real `<Link>`.
Decisions locked with the owner before implementation:

- Editorial about page (~5 short essay sections), not a marketing landing.
- Minimal one-row footer: brand · tagline · `O aplikaciji` + `Izvori` ·
  copyright. Hairline top rule, parchment ground.
- TopBar link slot between `Kurs` and the progress capsule. Hidden on
  ≤720px (the footer surfaces the page on mobile).
- Author attribution: generic `Tim History 365` byline (no single named
  editor yet).
- Sources lives inline as `#izvori` anchor on `/o-aplikaciji` — no
  separate `/izvori` route in v1.

### 7.1a — Footer primitive + mount

- `packages/ui-web/src/primitives/Footer/Footer.tsx` + `.module.css` —
  new stateless `Footer` component. `<footer role="contentinfo">`,
  `<Brand />`, tagline, `O aplikaciji` + `Izvori` links, copyright.
  Responsive: one row at ≥860px, wrap-cluster at 720–860, fully stacked
  below 720 with safe-area-aware horizontal padding inherited from the
  global `.shell`.
- `packages/ui-web/src/primitives/index.ts` — exports `Footer`.
- `apps/web/app/layout.tsx` — mounts `<Footer aboutHref="/o-aplikaciji"
  sourcesHref="/o-aplikaciji#izvori" />` after `<main>` inside
  `<AppProviders>`.
- `apps/web/app/globals.css` — `body` becomes a flex column with `main`
  growing, so the footer hugs the viewport bottom on short pages
  (upcoming-lesson placeholder) without floating mid-screen on tall ones.

### 7.1b — `/o-aplikaciji` route

- `apps/web/app/o-aplikaciji/page.tsx` — Server Component. Five
  `<section>` blocks: Misija, Urednički standard, O izvorima, Urednički
  tim, Kontakt. Editorial register matching the lesson reader (Eyebrow +
  serif title + lede + Flourish header, then h3 + body paragraphs at
  `--reading-col`). `mailto:` is the only outbound action; no form.
- `apps/web/app/o-aplikaciji/_copy.ts` — copy constants in Serbian; the
  single source of truth so the owner can iterate without touching JSX.
  Includes a `CONTACT_EMAIL` placeholder (`kontakt@history365.app`) that
  must be swapped before public launch (clearly tagged in the file).
- `apps/web/app/o-aplikaciji/page.module.css` — page layout, reading
  width, contact-link treatment (editorial mono with a hairline
  underline).
- The `O izvorima` section carries `id="izvori"` so the footer's
  `Izvori` link deep-links to it.
- Static-prerendered route; page title `O aplikaciji · History 365` via
  the root layout's title template.

### 7.1c — TopBar restoration + smoke

- `packages/ui-web/src/primitives/TopBar/TopBar.tsx` — new `aboutHref`
  prop and a third nav `<Link>` between `Kurs` and the progress capsule.
  Active state mirrors the existing `Početna` / `Kurs` treatment via
  `aria-current="page"` plus the `.active` class — no new CSS needed.
- `apps/web/components/top-bar/TopBarHost.tsx` — `routeFromPath` now
  returns `'about'` for any path starting with `/o-aplikaciji`; threads
  `aboutHref="/o-aplikaciji"` to the TopBar.
- `apps/web/e2e/smoke.spec.ts` — new test asserts the `contentinfo`
  footer is present, its `O aplikaciji` link navigates to
  `/o-aplikaciji`, the page heading renders, and the `#izvori`-anchored
  `O izvorima` heading exists.
- Mobile `@media (max-width: 720px)` rule in `TopBar.module.css` hides
  all text nav links — the new `O aplikaciji` link inherits the hide, so
  the mobile header still reduces to brand + progress capsule.

Files touched (7.1 total):
- `packages/ui-web/src/primitives/Footer/{Footer.tsx, Footer.module.css}`
- `packages/ui-web/src/primitives/index.ts`
- `packages/ui-web/src/primitives/TopBar/TopBar.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/o-aplikaciji/{page.tsx, page.module.css, _copy.ts}`
- `apps/web/components/top-bar/TopBarHost.tsx`
- `apps/web/e2e/smoke.spec.ts`
- `docs/archive/phases/PHASE_7_1_PLAN.md`, `docs/archive/reviews/NEXT_PHASE_RECOMMENDATION.md`

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm
build`. Playwright smoke (8 tests) passes on `chromium-desktop` and
`chromium-mobile`.

## Phase 7.2 — Home hero v2: done

Three sub-bundles ship inside one PR (7.2a → 7.2b → 7.2c). Closes the
"home page reads thinner than the lesson reader" gap called out in
`docs/archive/reviews/NEXT_PHASE_RECOMMENDATION.md` §2 Pick 2 — the home hero and eras
rail now carry the same editorial confidence as the lesson page, and the
course overview hero is no longer bare. Decisions locked with the owner
before implementation:

- Eras rail gains weight via a new `variant='home'` on the shared
  `HistoricalTimeline` component (not a separate `HomeJourneyRail`); the
  lesson page's `'full'` variant and the mobile drawer's `'compact'`
  variant are untouched.
- Hero ornamentation: a mono date / scope caption under the title
  (`~9500 p.n.e. → danas · 365 dana`) plus a `<Flourish />` between the
  lede and the CTA. Scope statement, not a state statement — does not
  change with user progress.
- Course overview hero gains a one-paragraph lede sourced from
  `course.description` (already canonical content data). No date line,
  no Flourish — course overview stays a navigation surface, not a second
  landing surface.

### 7.2a — Home hero ornamentation (date line + Flourish)

- `apps/web/app/page.tsx` — inside `.heroInner`, mono caption `<p>`
  inserted directly under `<h1>`; `<Flourish />` mounted between the
  lede and `<HomeHeroCta />`. `Flourish` imported from `@learn365/ui-web`.
- `apps/web/app/page.module.css` — `.heroDateLine` rule (mono font,
  muted colour, tabular-nums); hero gap rhythm tightened so the new
  caption sits cleanly under the title.

### 7.2b — `HistoricalTimeline` `'home'` variant + mount on home

- `packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.tsx`
  — `variant` prop extended to `'full' | 'compact' | 'home'`. New
  branch applies the home treatment without affecting existing call
  sites; per-era proportional widths, marker math (`timelineMath.ts`),
  `eraStats` shape, and the `eraHref` builder all reused as-is.
- `packages/ui-web/src/lesson/HistoricalTimeline/HistoricalTimeline.module.css`
  — `'home'` styles: taller panel (`var(--space-7)` inner padding), 3px
  rail, 13px markers with stronger ring, `.yearShort` shown on desktop
  (chronological readability), `--accent-soft` halo on the current era
  node so "you are here" is visible at the band level, more breathing
  room between bands.
- `apps/web/app/_components/HomeEraTimeline.tsx` — passes
  `variant='home'`. The home eras rail now reads as the centerpiece of
  a 365-day journey rather than a band of tabs.

### 7.2c — Course overview lede

- `apps/web/app/course/[courseId]/page.tsx` — header gains a single
  `<p>` lede directly under the `<h1>`, sourced from
  `course.description`. No new copy file, no new data field.
- `apps/web/app/course/[courseId]/page.module.css` — `.lede` rule at
  the reading column width, tuned to feel finished without competing
  with the home hero.

Files touched (7.2 total):
- `apps/web/app/page.tsx`, `apps/web/app/page.module.css`
- `apps/web/app/_components/HomeEraTimeline.tsx`
- `apps/web/app/course/[courseId]/page.tsx`,
  `apps/web/app/course/[courseId]/page.module.css`
- `packages/ui-web/src/lesson/HistoricalTimeline/{HistoricalTimeline.tsx, HistoricalTimeline.module.css}`
- `docs/archive/phases/PHASE_7_2_PLAN.md`

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm
build`. Playwright smoke continues to pass — visual-only change, no new
assertions added.

## Phase 7.3 — Section in breadcrumb: done

One commit, one file. Inserts `Section` as the 4th crumb on the lesson
page so the breadcrumb chain matches the four-level content hierarchy
(`Course → Era → Section → Lesson`) the sidebar already organises
around. Before: `Početna · Istorija Srbije 365 · Nemanjićka Srbija ·
DAN 053`. After: `Početna · Istorija Srbije 365 · Nemanjićka Srbija ·
Stefan Nemanja · DAN 053`. Decisions locked with the owner before
implementation, sharpened by a live audit of the deployed build:

- Insert section between era and day — the lesson page is the only
  surface that gains a crumb. Mobile `≤560px` rule (last-two-crumbs
  only) already in `Breadcrumbs.module.css` handles the longer chain
  without modification; visible mobile chain becomes
  `{section} · DAN nnn`, a clarity upgrade since section is the more
  specific parent.
- Section crumb links to the section's first lesson, mirroring the
  existing `eraHref` "navigate to first lesson" pattern. Consistency
  with the era crumb beats theoretical correctness; if both ever need
  to deep-link to the course overview, they reform together as a
  larger future phase. The `#era-section-{id}` anchor option was
  rejected — it would have required reopening `CourseOverviewEras`
  (panel ids are conditionally mounted) and would behave
  inconsistently with the existing era crumb.

Files touched (7.3 total):
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx`
  — new `sectionHref` `useCallback` mirroring `eraHref`; `breadcrumbs`
  `useMemo` extended from 4 to 5 items; dependency array gains
  `section.title`, `section.id`, `sectionHref`.
- `docs/archive/phases/PHASE_7_3_PLAN.md`

No `Breadcrumbs` primitive API change, no `CourseOverviewEras` change,
no new route, no content model change.

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm
build`. Playwright smoke continues to pass — the existing
breadcrumb-landmark assertion still holds; the new crumb is
data-driven from `section.title`.

## Fix — Sidebar era→section indent guide (post-7.3)

Era and Section headers in the sidebar / mobile drawer shared the same
left edge, so the Era → Section relationship was not immediately
legible. One-file fix, no behaviour change.

- `packages/ui-web/src/course/EraGroup/EraGroup.module.css` — `.body`
  shifted right by `var(--space-3)` (12px) so Section chevrons land
  visibly to the right of the Era chevron without crowding the narrow
  (~310px) mobile drawer panel. A 1px hairline at `left:24px` (Era
  chevron centre) softened with `color-mix(in oklch, var(--rule) 60%,
  transparent)` descends from the era row as a quiet editorial guide
  — explicitly not a tree connector. Lessons already pad +20px inside
  `SectionAccordion`, so the three levels now read Era → Section →
  Lesson without any further change.

Shipped as [PR #15](https://github.com/pavlekukric/learn365/pull/15) /
[`cb28710`](https://github.com/pavlekukric/learn365/commit/cb28710).

## Phase 7.4 — Course-page eras as editorial blocks: done

Shipped 2026-05-19 as PR #16 (merge commit `f6a849f`), one bundle of three commits (7.4a, 7.4b, 7.4c). Plan: [`docs/archive/phases/PHASE_7_4_PLAN.md`](./archive/phases/PHASE_7_4_PLAN.md). Predecessor: Phase 7.3 + post-7.3 sidebar indent fix.

The audit finding from [`docs/archive/reviews/UX_AUDIT_CURRENT_UI.md`](./archive/reviews/UX_AUDIT_CURRENT_UI.md) §4.4 was sharper than "add a disclosure" — the disclosure already existed on each `CourseCard`. The real problem was two-part: (1) the era *description paragraph* lived inside the disclosure, so closed eras read as bare nav rows with no editorial content; (2) `findActiveLocation` auto-expanded Era I + its first section on fresh state, so a first-time visitor landed on a fully-expanded Era I rather than 8 calm editorial blocks.

Three commits, one PR, low blast radius:

- **7.4a** ([`packages/ui-web/src/course/CourseCard/CourseCard.tsx`](../packages/ui-web/src/course/CourseCard/CourseCard.tsx)) — `CourseCard` gains optional `description` prop. When provided, renders as a body paragraph between the title block and the progress block. No-op for callers that don't pass it.
- **7.4b** ([`apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx`](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx)) — wires `era.description` from the content package into `CourseCard.description`. Era descriptions now read on the closed era surface (where they belong) rather than inside the disclosed section list. The duplicate description inside the disclosure panel is removed.
- **7.4c** (`CourseOverviewEras.tsx` initial-state effect) — eras default closed on fresh state. `findActiveLocation` still drives the auto-open behaviour when there *is* a `lastOpenedLessonId` or completed lessons (returning users still land on their in-progress era). Only the first-visit case changes: 8 calm editorial blocks instead of an expanded Era I.

What did not change: the `Pokaži odeljke · N` / `Sakrij odeljke` disclosure pattern stays as-is; `CourseProgress` card at the top of the page is unchanged and continues to answer "where would I start?" for fresh visitors; the era-level `href` (navigate to era's first lesson) is preserved on the `CourseCard` body link. No content model change, no new route, no `Breadcrumbs` or sidebar change.

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Playwright smoke continues to pass — the existing course-overview era-count assertion still holds (it counts `CourseCard`s, not disclosure state).

## Phase 7.7 — Mobile global nav restoration: done

Shipped 2026-05-19 as PR #17 (merge commit `2c8de8d`), one PR with two commits (a docs commit landing the roadmap + plan, then the implementation commit). Plan: [`docs/archive/phases/PHASE_7_7_PLAN.md`](./archive/phases/PHASE_7_7_PLAN.md). Predecessor: Phase 7.4 + the 2026-05-19 mobile UI/UX assessment.

The assessment surfaced a navigation bug on the live mobile build: `TopBar.module.css` was hiding **every** text nav link at ≤720px (`.nav a { display: none }`), so a first-time mobile user landed on Home with no path to `/course/...` from the global chrome — the in-page hero CTA jumps straight to the lesson reader, not the course overview. Brand carries Home and the footer carries `O aplikaciji`, but `Kurs` was effectively unreachable.

Implementation, one commit:

- **`packages/ui-web/src/primitives/TopBar/TopBar.tsx`** — three nav `<Link>`s gained stable `data-link='home' | 'course' | 'about'` attributes. No prop changes; the `route` semantic and existing `aria-current` / `.active` class continue to work.
- **`packages/ui-web/src/primitives/TopBar/TopBar.module.css`** — the `@media (max-width: 720px)` rule narrowed from `.nav a { display: none }` to `.nav a[data-link='home'], .nav a[data-link='about'] { display: none }`. Mobile masthead now reads: Brand · Kurs · ProgressCapsule. Comment updated to match the new register ("single section affordance preserves the masthead register without leaving the Course overview unreachable from the global chrome").
- **`apps/web/e2e/smoke.spec.ts`** — new test "TopBar Kurs link is reachable on every viewport" asserts the link is visible inside the `Glavna navigacija` nav and routes to `/course/istorija-srbije-365` when clicked. The test runs on every profile but is most load-bearing on `chromium-mobile` and `webkit-mobile`.

What did not change: the `Brand` mark or its href; `TopBar` props or its `route` semantic; the progress capsule (count, track width, label, or the 460px mini-bar drop); active-state styling; the footer mounting or link set; any in-page surface on Home / Course / Lesson. No new routes, no hamburger, no bottom tab bar.

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, `pnpm validate-content` (365/37/8), Playwright **9 tests × 5 profiles = 45 runs, 43 pass / 2 documented WebKit skips** (the existing skip-link assertion's Safari quirk; not relevant to this phase).

Roadmap context: this is the first bundle in [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md), the consolidated pre-Phase-8 roadmap drafted on 2026-05-19. Locked R1 named Phase 7.7 first.

## Phase 7.8 — Daily ritual anchor on Home: done

Shipped 2026-05-19 as PR #18 (merge commit `76f94fe`), bundled with the full-content drop in the same PR. Plan: [`docs/archive/phases/PHASE_7_8_PLAN.md`](./archive/phases/PHASE_7_8_PLAN.md). Predecessor: Phase 7.7 + Roadmap §B.

The 2026-05-19 mobile UI/UX assessment named retention the single biggest paid-product risk: Home opened with a course-catalog framing and stated nowhere on the first screen that this is a one-lesson-a-day product. Hero caption was chronological scope; the recommended-lesson card carried a state-aware eyebrow ("Prva lekcija" / "Nastavi gde si stao" / "Nedavno završeno") but no "you are on day N" anchor.

Implementation, one commit ([`2b69b63`](../../commit/2b69b63)):

- **`apps/web/app/_components/HomeDailyAnchor.tsx`** (new) — `'use client'` block reading `completedCount(state, courseId)`. Two states: idle (`completedCount === 0`) renders a single framing line `"Pred tobom je 365 dana kroz srpsku istoriju."`; in-progress (`completedCount > 0`) renders a mono eyebrow `"Tvoj {N}. dan"` plus body line `"Nastavi tamo gde si stao."` where `N = Math.min(completedCount + 1, 365)` — the day the user is *on*, not the last they finished. Output is `<section aria-label="Danas">`; no interactivity (the existing `HomeHeroCta` is the action).
- **`apps/web/app/page.tsx`** — `HERO_DATE_LINE` (`~9500 p.n.e. → danas · 365 dana`) renamed `HERO_CONTRACT_LINE` and the value swapped to `365 lekcija · 1 dnevno · ~8 minuta`. The new `<HomeDailyAnchor />` is mounted inside the existing `.current` section above `<HomeCurrentLessonCard />`.
- **`apps/web/app/page.module.css`** — `.dailyAnchor` / `.dailyAnchorEyebrow` / `.dailyAnchorLine` rules. Uses the existing flex `gap` on `.current` so the anchor and card read as a pair.
- **`apps/web/app/_components/HomeCurrentLessonCard.tsx`** — `<Eyebrow>` element, `LABEL_BY_STATE` map, and `Eyebrow` import removed. The component is now a pure passthrough to the `CurrentLessonCard` primitive. Card-internal state derivation (`'idle' | 'active' | 'done'`) is preserved.
- **`apps/web/e2e/smoke.spec.ts`** — new "home daily anchor reflects idle vs in-progress state" test seeds one completion via the persisted progress key and asserts the counter reads "Tvoj 2. dan".

What did not change: data model, storage shape (`learn365:progress:v1` schema), `HomeHeroCta`, `HomeEraTimeline`, era timeline component, TopBar progress capsule, course overview, lesson reader. No `startDate` storage, no real-calendar dates, no streaks. Phase 6.5's completion-driven rule (merely opening a lesson never flips into in-progress) is preserved.

Two locked decisions worth recording: D1 — two-state model (idle + in-progress), no done-today state (would require real-calendar awareness, out of scope per R2). D3 — the recommended-card eyebrow was dropped because the anchor above carries the state; keeping both would be duplicate signaling.

Gates locally + on CI green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, `pnpm validate-content`, Playwright **10 tests × 5 profiles = 50 runs, 48 pass / 2 documented WebKit skips** at implementation time. After the placeholder-test removal (see below), 9 × 5 = 45 runs, 43 pass / 2 skips.

## Content corpus — full 365 authored: done

Shipped 2026-05-19 as PR #18 (commit [`20a403f`](../../commit/20a403f)), bundled with Phase 7.8 in the same PR per owner direction. Content authoring was done outside any planned phase — it's a content-volume milestone, not a UI/UX phase.

All 365 lessons now carry real editorial content (was: 5 authored seed lessons + 360 placeholder stubs). `validate-content` baseline shifted from "5 authored / 360 placeholder" to **365 authored / 0 placeholder**. Course / era / section metadata refreshed in lockstep.

Lesson schema additions surfaced by the authoring pass: `subtitle`, `dateLabel`, `timelinePosition`, `summary`, `keyPeople[]`, `keyPlaces[]`. Paragraph blocks may carry `dropcap: true` for the editorial opening cap. `isPlaceholder: false` on every lesson — the field and the LessonReader upcoming-state code path stay in place for any future course where placeholders re-appear.

Operational change worth knowing: the runtime reads `packages/content/src/courses/istorija-srbije-365/_generated.ts`, which is generated from `content/courses/*.json` by `pnpm gen-content`. **Editing JSON without re-running gen-content leaves the app on stale content.** This bit the post-corpus gate run (Playwright placeholder test passed against the stale `_generated.ts` before the regen, then failed correctly after). Auto-regen on edit is a known quality-of-life gap recorded in `HANDOFF.md`.

Test suite impact: the obsolete `placeholder lesson shows upcoming state and hides completion` Playwright test and its `PLACEHOLDER_LESSON_ID` constant were removed — with 0 placeholders no fixture exists. The `isPlaceholder` field, the `LessonReader` upcoming-state UI, and the `LessonNavItem` dimmed-row styling all remain in place. Test count returns to 9 × 5 = 45 runs after the +1 daily-anchor test and the -1 placeholder test cancel out.

Gates on the merged PR: `pnpm validate-content` (365 authored / 0 placeholder), typecheck, lint, unit tests (79), build (6 routes, sizes unchanged from 7.8 alone), Playwright 9 × 5 = 45 runs / 43 pass / 2 documented WebKit skips. CI green on PR #18 before merge.

## Phase 7.9 — Progress narrative consolidation: done

Shipped 2026-05-19 as PR #19 (merge commit `d34a6eb`), one PR with two commits (the locked plan landed first, then the implementation). Plan: [`docs/archive/phases/PHASE_7_9_PLAN.md`](./archive/phases/PHASE_7_9_PLAN.md). Predecessor: Phase 7.8 + Roadmap §C.

The 2026-05-19 mobile UI/UX assessment flagged the course overview as carrying **six overlapping progress signals** for the same "where am I" job: TopBar capsule, `ProgressRing` percent, `N / 365 završeno` caption under the ring, parallel `Aktuelno` / `Sledeće` rows, plus a per-era `done / total` count + accent `u toku` chip. There was no canonical hierarchy — the screen answered the same question five different ways above the fold.

Locked decisions ([`docs/archive/phases/PHASE_7_9_PLAN.md`](./archive/phases/PHASE_7_9_PLAN.md) §1, all confirmed before code):

- **D1.** The single canonical row's eyebrow speaks the same journey-day register as the Phase 7.8 Home anchor — `TVOJ N. DAN` mid-course (formula `Math.min(completedCount + 1, 365)` identical to `HomeDailyAnchor`), `ZAPOČNI` idle. The course overview is now part of the daily-ritual narrative, not a second slightly-different counter.
- **D2.** The `Sledeće` row is dropped entirely. "What comes next?" is answered by the era accordion below and by the prev/next inside the lesson reader.
- **D3.** The `N / 365 završeno` ring meta line is dropped — duplicated the TopBar capsule and the ring's own `xx%` glyph. The ring stays as the visual centrepiece.
- **D4.** The accent `u toku` chip on the current `CourseCard` is dropped. Accent title colour, non-zero progress bar, and a non-zero `done / total` count carry that signal already.
- **D5.** Section-accordion row meta (`N lekcija` / `done / total`) is untouched — it's a drill-down detail, not a top-level competing counter.

Implementation, one commit ([`e154797`](../../commit/e154797)):

- **`packages/ui-web/src/course/CourseProgress/CourseProgress.tsx`** — `nextLesson` / `nextHref` props removed; the parallel `SLEDEĆE` row deleted. New `journeyDayLabel: string | null` prop (string mid-course like `'Tvoj 4. dan'`, null when idle); rendered through the row's `.rowLabel` class. `currentLesson` / `currentHref` renamed `lesson` / `href`; `hasStarted` retired (`journeyDayLabel !== null` answers the same question). The ring's `N / 365 završeno` caption element deleted.
- **`packages/ui-web/src/course/CourseProgress/CourseProgress.module.css`** — `.ringMeta` rule removed. `.rowLabel` gained `text-transform: uppercase` so the new title-case prop value renders consistently with the legacy uppercase literals.
- **`apps/web/app/course/[courseId]/_components/CourseOverviewProgress.tsx`** — next-lesson derivation block removed. `journeyDayLabel` computed inline (one selector read, one cap, one branch — no new selector in `@learn365/core`, per the "three similar lines is better than a premature abstraction" rule).
- **`packages/ui-web/src/course/CourseCard/CourseCard.tsx`** — `Chip` import + the `isCurrent` chip JSX deleted. Everything else (count, progress bar, status icon, accent title colour on `.current`) untouched.
- **`apps/web/e2e/smoke.spec.ts`** — new 10th smoke test "course progress consolidates to one canonical row + journey-day eyebrow" asserts no `SLEDEĆE` / `NASTAVI` / `u toku` strings, idle eyebrow is `ZAPOČNI`, seeded eyebrow flips to `Tvoj 2. dan`.

Net diff shape: 5 code files, **−39 lines** (116 deletions vs 77 insertions). Deletion-heavy, as the plan predicted.

What did not change: data model, storage shape (`learn365:progress:v1` schema), `@learn365/core` selectors, `HomeDailyAnchor` / `HomeCurrentLessonCard` / `HomeHeroCta` / `HomeEraTimeline`, TopBar progress capsule, era timeline component, era accordion logic in `CourseOverviewEras`, section-row meta, `CourseCard` progress bar, lesson reader / sidebar / drawer / prev/next. Phase 6.5's completion-driven rule preserved.

Gates locally green on the feature branch before merge: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, `pnpm validate-content` (365 / 37 / 8). Unit tests 76 / 76. Playwright **10 tests × 5 profiles = 50 runs, 48 expected pass / 2 documented WebKit skips**.

Roadmap context: this is Bundle C from [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md). With 7.7 / 7.8 / 7.9 shipped, the remaining backlog is 7.10 + 7.12 (combined editorial PR — trust scaffolding + figures), 7.11 (reading comfort), 7.5 (mobile sticky chrome), 7.6 (course scroll restore), and a hero backdrop QA pass.

## Phase 7.10 + 7.12 — Lesson trust scaffolding + figure renderer: done

Shipped 2026-05-19 as PR #20 (squash commit `7fb1d18`), one PR with two commits — schema + UI surface, then seed content. Plan: [`docs/archive/phases/PHASE_7_10_7_12_PLAN.md`](./archive/phases/PHASE_7_10_7_12_PLAN.md). Predecessor: Phase 7.9 + Roadmap §D / §F (Bundles D and F combined per the original roadmap proposal of a single editorial PR window).

The 2026-05-19 mobile UI/UX assessment flagged the lesson reader as carrying **no credibility surface** — no byline, no review date, no sources, and the schema's `image` block rendered as an empty placeholder div instead of a real `<figure>`. The post-7.8 corpus also made the roadmap's original "sources required on authored lessons" rule infeasible — "authored" now means all 365, so the bundle had to be rescoped before any code landed.

Locked decisions ([`docs/archive/phases/PHASE_7_10_7_12_PLAN.md`](./archive/phases/PHASE_7_10_7_12_PLAN.md) §1, all confirmed before code):

- **D1 — Scope ceiling.** Schema + UI ship for all 365 lessons (universal surface, consistent rendering). Actual content (`byline`, `lastReviewedAt`, `sources`) backfills only the 6 editorial seed lessons (Days 1, 7, 31, 106, 200, 305) in this PR. The remaining 359 render unchanged. Reframes the original 1.5–2 day code phase around the post-corpus reality.
- **D2 — Byline shape.** `Lesson.byline?: { author?: string; reviewer?: string }`. Both roles independently optional. **No generic course-wide fallback** — if a lesson has no real byline, render nothing. The renderer absence is preferable to fake-byline syndrome.
- **D3 — `lastReviewedAt`.** Optional ISO date string (`YYYY-MM-DD`). Validated at load time. Rendered next to byline (or alone) in mono uppercase via `Intl.DateTimeFormat('sr-RS')`.
- **D4 — `sources[]`.** Typed-kind union (`book | article | museum | archive | web`) with `title`, optional `author` / `year` / `url`. Rendered as a closing `Izvori` editorial block (new `<LessonSources>` component) appended between body and footer. URLs (when present) open in new tabs with `rel="noopener noreferrer"`.
- **D5 — Figures.** Two-part: (i) `<LessonBody>` image branch swapped from placeholder div to real `<figure>` + `next/image` + `<figcaption>` (with `width` / `height` promoted to required on the `image` block); (ii) 8 curated era-opener figures **deferred to Phase 7.12b** (binary image curation surfaced as a separate workstream during implementation — public-domain / CC sourcing, license vetting, dimension capture).
- **D6 — No validator enforcement.** Reversal of the original roadmap's "CI fails if authored lesson has no sources" rule, which was written pre-corpus and would now fail the build for 359 lessons. Shape-validation only (ISO regex, URL parse, kind union, non-empty `sources` array). The validator script (`validateContentFiles.ts`) is unchanged — the loader catches every shape problem at load time.
- **D7 — One PR, two commits.** Commit-a (`bf8d2aa`): schema + UI surface, zero visual change for every lesson (no data yet). Commit-b (`3d1b8a3`): `lastReviewedAt` + 3–4 sources on the 6 seeds. Plan doc carried in commit-a.

What changed concretely:

- `packages/content/src/types.ts` — added `Source`, `SourceKind`, `LessonByline`; extended `Lesson` with `byline?` / `lastReviewedAt?` / `sources?`; promoted `width` / `height` to required on `image` `LessonBlock`.
- `packages/content/src/index.ts` — exported the new types.
- `packages/content/src/loader/loadCourseFromFiles.ts` — added `parseByline`, `parseLastReviewedAt`, `parseSource`, `optionalSources`; extended `parseBlock`'s `'image'` branch to require positive-integer width/height.
- `packages/ui-web/src/lesson/LessonSources/` — new component (3 files: `LessonSources.tsx`, `LessonSources.module.css`, `index.ts`). Renders an `aria-labelledby` section with an `<ol>` of per-source entries; format `Author (Year) · Title`; entries with `url` become external `<a>`. Visual register: editorial body type on an `--ink-2` ramp, accent-mixed underline that promotes to full accent on hover/focus.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` — added `formatTrustLine` helper that composes `NAPISAO: … · PREGLEDAO: … · POSLEDNJI PREGLED: dd. mm. yyyy.` from whichever fields are present. Trust line renders below the lede in the same mono-uppercase register as the reading-time eyebrow. `LessonHeader.module.css` gained a `.trust` rule with letter-spacing 0.12em and a negative top margin so the two eyebrows read as a stack, not separate lines.
- `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` — mounted `<LessonSources>` between `<LessonBody>` and the `<footer>` when `lesson.sources` is non-empty.
- `packages/ui-web/src/lesson/LessonBody/LessonBody.tsx` — `case 'image'` now returns `<figure>` containing `next/image` (with `sizes="(max-width: 720px) 100vw, 720px"`) + optional `<figcaption>`. Caption string carries the attribution per D4.
- `packages/ui-web/src/lesson/LessonBody/LessonBody.module.css` — replaced `.imagePlaceholder` with `.image` (real img styling: full width, auto height, rounded corner, hairline rule border).
- `packages/ui-web/src/lesson/index.ts` — exported `LessonSources`.
- Seed content: `content/courses/istorija-srbije-365/lessons/day-{001,007,031,106,200,305}.json` each gained `lastReviewedAt: "2026-05-19"` + 3–4 sources. Citations mix `book` (Srejović on Lepenski Vir; Winn on Vinča script; Barnes on Constantine; Ćirković/Dinić on the post-Uroš collapse; Ranke/Stojančević on the First Uprising; Banac/Gligorijević on Vidovdanski ustav), `article` (primary sources like Vita Constantini), `museum` (Lepenski Vir / Narodni muzej / Mediana / Niš), and `archive` (Arheološki institut SANU; Arhiv Srbije; Arhiv Jugoslavije). No URLs — avoids link-rot in v1.
- `packages/content/src/courses/istorija-srbije-365/_generated.ts` — regenerated. 6 lesson literals carry `sources` arrays; the other 359 are byte-identical to pre-phase.

What did not change: storage shape (`learn365:progress:v1`), `@learn365/core` selectors, `HomeDailyAnchor` / `HomeCurrentLessonCard` / `HomeHeroCta` / `HomeEraTimeline`, TopBar progress capsule, course-overview surfaces, era timeline, sidebar / drawer / prev-next. `keyPeople` / `keyPlaces` (added in 7.8) remain unrendered — separate consolidation concern, deliberately out of scope.

Gates locally green on the feature branch before merge: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, `pnpm validate-content` (365 / 0 / 37 / 8). Unit tests 76. CI green on PR #20 before merge (1m 25s for the typecheck/test/build job). Vercel preview deploy green. Screenshot pack regenerated — 19 captures pass; the 2 pre-existing `lesson-placeholder` failures (asserting on the upcoming-state that no longer exists post-7.8) are unrelated and will be retired in a future cleanup.

Open work surfaced by this phase (carried into HANDOFF as the next pre-Phase-8 backlog):

- **Seed bylines** — 6 one-line JSON edits when the editorial team is decided. Renderer is wired; no schema or UI work required.
- **Phase 7.12b — era-opener figures** — 8 curated images under `apps/web/public/lessons/` + JSON `image` block insertions + caption attribution. Renderer is wired; the work is curation.

Roadmap context: this is Bundles D + F from [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md). With 7.7 / 7.8 / 7.9 / 7.10+7.12 shipped, the remaining backlog is 7.11 (reading comfort — primary next pick), 7.12b (era-opener figures), seed bylines, 7.5 (mobile sticky chrome), 7.6 (course scroll restore), and a hero backdrop QA pass.

## Phase 7.12b — Era-opener figures: done

Shipped 2026-05-19 as the era-opener figure pass (PR + merge pending — bundled as a single commit window). Plan: [`docs/archive/phases/PHASE_7_12B_PLAN.md`](./archive/phases/PHASE_7_12B_PLAN.md). Predecessor: Phase 7.10 + 7.12-a (figure renderer + sources scaffolding, PR #20, `7fb1d18`). This is Bundle F-residual from [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md) — the figure-insertion half of the original 7.12 bundle, deferred from the 7.10 PR because image curation is a separable schedule risk.

Locked decisions ([`docs/archive/phases/PHASE_7_12B_PLAN.md`](./archive/phases/PHASE_7_12B_PLAN.md) §2, all confirmed before code):

- **D1 — Insertion position.** Each `image` block sits at `content[1]` — after the dropcap paragraph and before the second paragraph. This preserves the renderer's auto-dropcap on `index === 0` ([packages/ui-web/src/lesson/LessonBody/LessonBody.tsx:24](../packages/ui-web/src/lesson/LessonBody/LessonBody.tsx#L24)) and gives every figure a textual lede that reads first. Rejected alternative: figure as `content[0]` (would have required adding `dropcap: true` explicitly on what is now paragraph 2 — foot-gun for the 357 lessons that never get figures).
- **D2 — Image dimensions / format.** WebP, 1440 px wide max (`sharp .resize({ width: 1440, withoutEnlargement: true })`), q=82 default, sRGB. Effort-6 encoder. The renderer's `sizes="(max-width: 720px) 100vw, 720px"` rule means 1440 px is 2× retina against the 720 px desktop column. Two source images came in below 1440 px native — Era II (787 × 840 native, kept at native — Wikimedia's largest available revision) and Era V (1409 × 1562 — 2% below target, accepted). Three files needed quality re-passes for budget compliance: Era 6 (portrait, q=58, 557 KB — accepted over the 220 KB soft target per plan R2 "accept the larger file size"), Era 7 (portrait, q=74, 199 KB), Era 8 (map, q=75, 276 KB).
- **D3 — Caption + attribution.** Single Serbian sentence of editorial framing followed by the attribution clause. Format: `{Serbian description ~10 words}. Foto: {Author}, {License}, Wikimedia Commons.` for CC images; `… Javno vlasništvo, Wikimedia Commons.` for PD. The `caption` field is also the attribution field per the schema comment in [`packages/content/src/types.ts`](../packages/content/src/types.ts).
- **D4 — Curation path.** Shortlist route: a subagent compiled 2–3 vetted Wikimedia Commons candidates per era with quoted license-line excerpts, the owner picked one per era from the shortlist. Era VI surfaced as a single-candidate slot (Garašanin-era engravings on Commons are sparse) and was accepted.
- **D5 — Alt-text policy.** Factual visual description in Serbian, not the subject's name and not a caption duplicate. Example: `Formalna fotografija starijeg kralja sa sedom bradom u tamnoj uniformi sa epoletama` (alt) vs `Kralj Petar I Karađorđević, vladar Srbije u Balkanskim ratovima` (caption).
- **D6 — Validator change.** None. The existing loader rule on positive-integer `width`/`height` ([packages/content/src/loader/loadCourseFromFiles.ts:341-345](../packages/content/src/loader/loadCourseFromFiles.ts#L341-L345)) is sufficient. No "era-openers must carry an image" invariant was introduced — would be fragile against section renames or future content reshuffles.
- **D7 — Asset paths.** `apps/web/public/lessons/era-{order}-{slug}.webp`. JSON `src` is the public-rooted `/lessons/era-N-slug.webp`.

The 8 era-opener lessons identified by min `startDay` per era (from [`content/courses/istorija-srbije-365/sections.json`](../content/courses/istorija-srbije-365/sections.json)):

| Era | Day | File | Lesson |
| --- | --- | --- | --- |
| I | 1 | `era-1-lepenski-vir.webp` | day-001 — Lepenski Vir — naselje na Dunavu |
| II | 46 | `era-2-pre-nemanjica.webp` | day-046 — Srbija pre Nemanjića: Raška i Duklja |
| III | 106 | `era-3-srpske-zemlje-posle-carstva.webp` | day-106 — Srpske zemlje posle carstva |
| IV | 151 | `era-4-ustrojstvo-osmanskog-carstva.webp` | day-151 — Ustrojstvo Osmanskog carstva |
| V | 196 | `era-5-srpska-revolucija.webp` | day-196 — Šta je Srpska revolucija |
| VI | 231 | `era-6-ustavobranitelji.webp` | day-231 — Ustavobraniteljski režim |
| VII | 281 | `era-7-balkanski-savez.webp` | day-281 — Balkanski savez 1912. |
| VIII | 341 | `era-8-raspad-jugoslavije.webp` | day-341 — Raspad Jugoslavije — uzroci |

License mix: 2 PD-source (Era 6 PD-Serbia, Era 7 PD-1923 / US-no-notice), 6 CC BY-SA (Era 1 CC BY-SA 4.0, Era 2 CC BY-SA 3.0, Era 3 CC BY-SA 3.0, Era 4 CC BY-SA 3.0, Era 5 CC BY-SA 4.0, Era 8 CC BY-SA 3.0). Every caption ends in a valid attribution clause naming source + license. The curation subagent quoted the license-line text from each Commons page for owner audit; the shortlist with all rejected and accepted candidates lives in the conversation log for the phase.

What changed concretely:

- 8 new WebP assets at `apps/web/public/lessons/era-{1..8}-{slug}.webp` (total ~1.5 MB across all 8 files, individually 28–557 KB). Sourced via Commons `Special:FilePath` redirect, encoded with `sharp@0.34.5` / libvips 8.17.3.
- 8 JSON edits adding one `image` block at `content[1]` to each era-opener lesson: [`content/courses/istorija-srbije-365/lessons/day-001.json`](../content/courses/istorija-srbije-365/lessons/day-001.json), `day-046.json`, `day-106.json`, `day-151.json`, `day-196.json`, `day-231.json`, `day-281.json`, `day-341.json`. Pure additive diffs (8 lines per file, 64 total), no reformatting churn — inserted via text-surgical patch that preserves the repo's inline-array CRLF convention.
- [`packages/content/src/courses/istorija-srbije-365/_generated.ts`](../packages/content/src/courses/istorija-srbije-365/_generated.ts) regenerated via `pnpm gen-content` to reflect the JSON edits.

What did not change: zero code in `apps/web`, `packages/{ui,ui-web,core,content}`. The renderer (shipped in 7.10), schema (`{ type: 'image', src, alt, width, height, caption? }`), loader (positive-integer rule), and validator all already did what this phase needed. No `next.config.mjs` `images.remotePatterns` was added — all 8 images are local under `/public`.

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm validate-content`. Test counts unchanged (no new unit tests required — renderer + schema were unit-tested at 7.10). Production build shapes static + dynamic routes identically to pre-7.12b. The Next.js Image pipeline auto-optimizes each WebP at request time.

Open work surfaced by this phase: none. The figure pipeline is self-contained.

Roadmap context: this closes Bundle F from [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md) for the era-opener subset of lessons. Figures on non-era-opener lessons remain a future editorial pass, not a phase. With 7.7 / 7.8 / 7.9 / 7.10+7.12-a / 7.11 / 7.12b shipped, the remaining backlog is Phase 7.5 (mobile sticky chrome — pre-7.0 polish), Phase 7.6 (course scroll restore — pre-7.0 polish), seed bylines (1-line JSON edits when authors are decided), a hero backdrop QA pass at 360 / 768 / 1280 / 1920, and a small consolidation phase for the `keyPeople` / `keyPlaces` rendering surface.

## Phase 7.11 — Lesson bookmarks + saved-lessons surface: done

Shipped 2026-05-19 as PR #21 (squash commit `1fffe95`), one PR with two commits — core bookmarks module + tests, then web wiring + UI. Plan: [`docs/archive/phases/PHASE_7_11_PLAN.md`](./archive/phases/PHASE_7_11_PLAN.md). Predecessor: Phase 7.10 + 7.12 + Roadmap §E (Bundle E).

**Surprise finding during inspection:** the roadmap called `ReadingProgress.tsx` a "stub to wire," but the component was already implemented and already mounted at `LessonPageClient.tsx`. So the phase collapsed to bookmarks-only + a manual QA pass on the existing hairline. The plan doc records the discovery.

Locked decisions ([`docs/archive/phases/PHASE_7_11_PLAN.md`](./archive/phases/PHASE_7_11_PLAN.md) §"Locked decisions", all confirmed before code):

- **L1 — Toggle placement.** Top-right of `LessonHeader`, always visible across viewports (not in the sticky `LessonContextHeader` which is mobile-only; not next to `MarkAsCompletedButton` which fires post-read). Suppressed on placeholder lessons via the same gate that hides the eyebrow on placeholders.
- **L2 — Separate store mirroring `ProgressStorage`.** New module `packages/core/src/bookmarks/` with `BookmarkStorage` (identical shape to `ProgressStorage`), `createBookmarkStore`, `isBookmarked` / `bookmarkCount` / `bookmarkedLessonIds` selectors. Separate `learn365:bookmarks:v1` key so the future backend can ship `/api/bookmarks` independently of `/api/progress`.
- **L3 — Empty state.** `<CourseOverviewBookmarks>` renders nothing when the list is empty — no generic "ovde će se pojaviti…" copy. Matches the Phase 7.10 trust-line rule. The bookmark icon in the lesson header is the discovery surface; the course overview is the return surface.
- **L4 — Icon.** New `IconBookmark` with `filled?: boolean` prop. Outline by default, solid fill when saved. Matches `IconCheck` stroke vocabulary (16×16, 1.6 stroke, currentColor, round joins).
- **L5 — A11y.** `<button type="button" aria-pressed={isBookmarked} aria-label={…}>` with Serbian labels (`Sačuvaj lekciju` / `Ukloni iz sačuvanih`). No tooltip — Editorial direction is calm.
- **L6 — Reading progress.** QA pass only, no rework. The existing component was verified to mount, hide on non-scrollable pages, and not collide with the sticky TopBar.

What changed concretely:

- `packages/core/src/bookmarks/{types,store,selectors,index}.ts` — new module mirroring `progress/` shape. Set-to-array JSON replacer/reviver. 14 unit tests across `store.test.ts` (6) + `selectors.test.ts` (8).
- `packages/core/src/index.ts` + `packages/core/package.json` — export the new module + `./bookmarks` subpath.
- `apps/web/lib/bookmarks/{localStorageAdapter,BookmarkStoreProvider}.tsx` — web adapter + React provider, copy-adapted from the progress equivalents.
- `apps/web/app/providers.tsx` — wraps children in `<BookmarkStoreProvider>` (nested inside the existing `<ProgressStoreProvider>`, independent state).
- `packages/ui-web/src/icons/IconBookmark.tsx` + `icons/index.ts` — new icon with the filled-vs-outline prop.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx` — accepts optional `bookmarkAction?: { isBookmarked, onToggle }`. Renders the toggle in the top-right of the header block (44 px hit target, absolute-positioned so it doesn't reflow the flex column). Suppressed on placeholders and when the prop is absent — every existing caller is unchanged.
- `packages/ui-web/src/lesson/LessonHeader/LessonHeader.module.css` — `position: relative` on the header, new `.bookmark` rule with hover/focus-visible/aria-pressed states.
- `packages/ui-web/src/lesson/LessonHeader/index.ts` — re-export `LessonBookmarkAction` type.
- `packages/ui-web/src/lesson/LessonReader/LessonReader.tsx` — accepts the prop and forwards it to `<LessonHeader>`.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx` — reads `isBookmarked` + `toggleBookmark` from `useBookmarkStore`, constructs `bookmarkAction`, passes to `<LessonReader>`.
- `apps/web/app/course/[courseId]/_components/CourseOverviewBookmarks.{tsx,module.css}` — new surface. Resolves bookmarked ids to `Lesson` + `Era`; drops any orphaned ids (corpus regen / slug change) silently. 2-column grid on desktop / 1-column on mobile; each card has day kicker, 2-line clamped title, era label. Renders nothing if the resolved list is empty.
- `apps/web/app/course/[courseId]/page.tsx` — slots `<CourseOverviewBookmarks>` between `<CourseOverviewProgress>` and the Sadržaj `<section>`.

What did not change: storage shape (`learn365:progress:v1` untouched), `@learn365/core` progress selectors, `packages/content/` schema, any lesson JSON, any era / section data, the TopBar, the Home surfaces, the sidebar / drawer, the era timeline, or the post-completion CompletedFooter.

Gates locally green on the feature branch before merge: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Unit tests now total 47 in `@learn365/core` (14 new in `bookmarks/`) + 21 in `@learn365/ui-web` = 68 total. CI green on PR #21 before merge (1m 20s for the typecheck/test/build job). Vercel preview deploy green. SSR smoke (curl) verified the bookmark button renders with the correct `aria-label` + `aria-pressed`, and that the course overview correctly omits the "Sačuvane lekcije" block when the list is empty.

Open work surfaced by this phase: none. The bookmark feature is self-contained; the existing reading-progress hairline was confirmed in place. Highlights / notes and cross-device sync remain explicit post-MVP / Phase 8 work per the plan's "Out of scope" section.

Roadmap context: this is Bundle E from [`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md). With 7.7 / 7.8 / 7.9 / 7.10+7.12 / 7.11 shipped, the remaining backlog is 7.12b (era-opener figures — pending image curation), seed bylines (1-line JSON edits when authors are decided), 7.5 (mobile sticky chrome), 7.6 (course scroll restore), and a hero backdrop QA pass.

## Phase 7.5 — Mobile lesson sticky chrome scroll-collapse: done

Shipped 2026-05-19 as PR #23 (squash commit `4325e64`), one PR / one commit. Plan: [`docs/archive/phases/PHASE_7_5_PLAN.md`](./archive/phases/PHASE_7_5_PLAN.md). Predecessor: Phase 7.12b (era-opener figures, `542edad`). Existing pre-7.0 polish backlog item.

On single-column lesson layouts (≤1024px), the `LessonContextHeader`'s secondary meta row (era label + total progress) collapses on scroll-down and restores on scroll-up, reclaiming vertical reading space. The top row (`Sadržaj` contents trigger + day indicator) stays sticky at all times, so navigation is never stranded mid-lesson.

Locked decisions ([`docs/archive/phases/PHASE_7_5_PLAN.md`](./archive/phases/PHASE_7_5_PLAN.md) §1, confirmed before code):

- **D1 — Collapse the meta row only; keep the contents row always sticky.** Rejected hiding the whole header (would slide the `Sadržaj` trigger off-screen mid-read).
- **D2 — Active at all single-column widths (≤1024px)**, exactly where the header is shown; the desktop two-column layout has `display: none` on the header and is untouched.
- **D3 — Direction-based with an ~8px dead-zone + a top-of-page reveal guard** so the motion reads calm, not twitchy.
- **D4 — Respect `prefers-reduced-motion`** (transition removed; collapse logic still runs).
- **D5 — One PR, single commit.**

What changed concretely:

- `apps/web/app/course/[courseId]/lesson/[lessonId]/useScrollDirection.ts` — **new** client hook `useMetaRowCollapsed()`: rAF-coalesced passive `scroll` listener mirroring `ReadingProgress`'s pattern, with the D3 dead-zone + top-of-page guard. Sets state only on a genuine direction flip, so React re-renders are rare.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx` — toggles a `collapsed` class on the root and `aria-hidden` on the meta row (synced to collapsed so the row is not announced/focusable while hidden). Props + markup otherwise unchanged.
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.module.css` — inside the existing `@media (max-width: 1024px)` block, `.metaRow` becomes a `max-height`/`opacity`/`margin-top` collapse on the **inner** row (not a transform on the sticky root), preserving sticky positioning + backdrop blur and avoiding any prose reflow. Plus a `prefers-reduced-motion` rule.
- `apps/web/e2e/smoke.spec.ts` — new mobile-profile assertion: scrolling down hides the meta row (height → 0) while the contents trigger stays visible; scrolling to top restores it. Skips on the desktop two-column profiles.

What did not change: the global TopBar (stays fully sticky), the desktop two-column lesson layout, `ReadingProgress`, the `MobileLessonDrawer` and its trigger semantics, any content JSON / schema / `_generated.ts`, and anything in `apps/api`.

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Playwright suite now **11 tests × 5 profiles = 55 runs, 50 pass / 5 skips** (2 WebKit skip-link + 3 desktop meta-row-collapse N/A). Unit test totals unchanged (no new unit tests — the hook is exercised via e2e). Implementation note: the collapse listener attaches after hydration, so the e2e test nudges the scroll until a direction change registers (a synthetic-test timing artifact, not a real-user concern).

Open work surfaced by this phase: a dedicated *scrolled-state* screenshot was **not** added to `pnpm screenshots`, so the collapsed state is not in the baseline pack (deferred; the live Vercel preview was the visual QA surface).

Roadmap context: this closes the 7.5 pre-7.0 polish item. Remaining backlog: Phase 7.6 (course scroll restore — pre-7.0 polish), seed bylines (1-line JSON edits when authors are decided), a hero backdrop QA pass at 360 / 768 / 1280 / 1920, and a small consolidation phase for the `keyPeople` / `keyPlaces` rendering surface.

## Phase 7.6 — Course page scroll restore: done

Shipped 2026-05-21 as PR #24 (squash commit `17f2715`), one PR / one commit. Plan: [`docs/archive/phases/PHASE_7_6_PLAN.md`](./archive/phases/PHASE_7_6_PLAN.md). Predecessor: Phase 7.5 (mobile sticky-chrome scroll-collapse, `4325e64`). Existing pre-7.0 polish backlog item.

Returning to the course overview within a browser session now restores the reader's prior scroll position instead of resetting to the top. A live probe confirmed Next's built-in restoration misses here (browser back → 130px, breadcrumb `Kurs` → 0, vs. ~1000 expected) because the progress-driven era accordion (`CourseOverviewEras`) settles **after** hydration, so the page's final height is unknown when the framework restores.

Locked decisions ([`docs/archive/phases/PHASE_7_6_PLAN.md`](./archive/phases/PHASE_7_6_PLAN.md) §1, confirmed before code):

- **D1 — Restore on any return within the browser session.** `sessionStorage`, key `learn365:course-scroll:<courseId>`. Fresh tab / first visit lands at top. Rejected the stricter "only when arriving from a lesson" (needed previous-path tracking for marginal benefit).
- **D2 — Scroll offset only; accordion shift out of scope.** The "accordion auto-opens the last-opened lesson's era" behaviour is unchanged, so the expanded era can differ on return; the restored offset still lands the reader near where they were. Persisting accordion open-state is a separate, larger change.
- **D3 — Instant, settle-aware restore.** D4 — one commit.

What changed concretely:

- `apps/web/app/course/[courseId]/CourseScrollRestore.tsx` — **new** `'use client'` component, renders `null`. (a) Sets `history.scrollRestoration = 'manual'` on mount (restored on unmount) so the browser/Next cached-route restore can't compete. (b) Saves `scrollY` to `sessionStorage` debounced, and **freezes saving + records the genuine position the instant a link is clicked** (capture-phase click listener) so navigation scroll-noise can't clobber it. (c) Restores on mount via a settle-aware rAF enforcement loop (~1s budget, ≈60 frames) that waits for client content height and re-asserts the target each frame to beat the framework's deferred scroll-to-top, suppressing saves meanwhile.
- `apps/web/app/course/[courseId]/page.tsx` — mounts `<CourseScrollRestore courseId={course.id} />` (one import + one element).
- `apps/web/e2e/smoke.spec.ts` — new assertion on all 5 profiles: scroll to a confirmed-persisted offset, leave to a lesson, return via the breadcrumb `Kurs` link, assert the offset is restored.

What did not change: `CourseOverviewEras` accordion logic, the lesson reader / `ReadingProgress` / the 7.5 meta-row collapse, navigation / links / breadcrumbs / TopBar, the `localStorage` progress + bookmark keys (the new key is `sessionStorage` **view state**, not part of the backend swap seam), and any content JSON / schema / `_generated.ts`.

Gates locally green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Playwright suite now **12 tests × 5 profiles = 60 runs, 55 pass / 5 skips**; the new test passes deterministically across Chromium / Firefox / WebKit, desktop + mobile. Unit test totals unchanged (the component is exercised via e2e). Implementation notes: (1) the framework's competing restore + a transition scroll-noise to ~130px were the two hard-won root causes — the `manual` ownership + click-time freeze fix them deterministically; (2) one e2e flake was a harness artifact (Playwright auto-scrolls a click target into view before clicking, moving the page off the saved offset), resolved by leaving via direct navigation in the test rather than clicking an off-screen link.

Open work surfaced by this phase: a possible ≤1-frame top→offset flash on forward-`Link` returns is accepted (the enforcement re-asserts on the earliest settle frame); the D2 accordion-shift interaction is the natural follow-up if "restore the whole page state" is ever wanted.

Roadmap context: this closes the 7.6 pre-7.0 polish item — the last of the two pre-7.0 polish items (7.5 + 7.6). Remaining pre-Phase-8 backlog is all small/optional: seed bylines, a hero backdrop QA pass, and a `keyPeople` / `keyPlaces` rendering consolidation phase.

## Next step

The forward-looking pointer now lives in [`HANDOFF.md`](../HANDOFF.md) at the repo root. It records the carry-forward non-blocking deferrals, the active pre-Phase-8 backlog ([`docs/ROADMAP_PRE_PHASE_8.md`](./ROADMAP_PRE_PHASE_8.md)), and the auto-regen `_generated.ts` quality-of-life candidate from the 7.8 PR. (Phase 8 later shipped as Next.js route handlers + PostgreSQL, not .NET 9 + SQL Server — see "Phase 8" above.)

With both pre-7.0 polish items (7.5 + 7.6) shipped, the remaining pre-Phase-8 backlog is all small/optional — seed bylines (1-line JSON edits when authors are decided), a hero backdrop QA pass at 360 / 768 / 1280 / 1920, and a small consolidation phase for `keyPeople` / `keyPlaces` rendering. The owner may also declare web v1 visually approved and move to Phase 8 (Backend).

Phase plans for shipped phases (6.7 through 7.6) live in [`docs/archive/phases/`](./archive/phases/). Superseded UX reviews and audits live in [`docs/archive/reviews/`](./archive/reviews/). Treat both archive folders as historical — do not consult them when assessing current state.
