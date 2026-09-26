# Handoff — History 365 / Istorija Srbije 365

**Last updated:** 2026-09-25, after the core-loop polish (resume rule, first-win moment, course start state, `Pročitano` label) — group 1 of the 2026-09-25 product review, unmerged. See PROJECT_STATE → "Polish — Core loop". Before that: 2026-05-21, the mobile lesson context header made always visible (unmerged at the time). See PROJECT_STATE → "Polish — Mobile lesson context header always visible (2026-05-21)". Prior milestones: the mobile lesson de-duplication polishes (PRs #25, #26) and Phase 7.6 ship (PR #24, `17f2715`).

This is the live forward-looking pointer for the project. **Read this before starting any new phase.** It tells you what is true now and what the strongest next moves are.

For the full current state, read [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — the "Current Baseline" section at the top is the do-not-regress floor.

---

## Where the app is right now

- **Web v1 is live** at https://learn365-web.vercel.app/ (Vercel project `learn365-web`, auto-deploys from `main`). **Hosting migration in progress (2026-09-26):** moving to the owner's Hetzner VPS (shared with the Računi app, which must never be touched) behind a Cloudflare Tunnel. The repo side is done — `apps/web/Dockerfile`, `.github/workflows/deploy.yml`, `deploy/` — and waits on the owner's domain purchase, then server setup, tunnel, GitHub secrets. Step-by-step runbook + status table in [`docs/DEPLOY.md`](docs/DEPLOY.md). Next after that: accounts (Google sign-in) + cloud progress, Next.js route handlers + Postgres on the same box; the sign-in is asked for when a reader marks a **second** lesson done, reading stays public. `docs/BACKEND_STRATEGY.md` still describes the older .NET plan and will be revised when that phase starts.
- **Core loop polish (2026-09-25, unmerged working tree).** Every "start / continue" action (Home hero CTA, Home recommended card, course progress card) now resolves through one rule — `findResumeLesson` in `@learn365/core` via `apps/web/lib/progress/useResumeLesson.ts`: Day 1 until something is completed, then the unfinished lesson the reader left, else the first unread day, never a completed one. Finishing a lesson shows a first-win moment (`Prvi dan je iza tebe.` + `Pročitano 1 / 365`) and scrolls the next-lesson card into view. The course card has a real start state (`Počni od Dana 1 →`, no empty `0%` ring) and, once started, counts lessons in the ring instead of a percent. TopBar label is `Pročitano`, visible on mobile too. New `e2e/resume.spec.ts`.
- **Phase 7.6 just shipped** (PR #24, `17f2715`) — returning to the course overview within a browser session restores the reader's prior scroll position (Next's built-in restoration misses because the era accordion settles after hydration). New `CourseScrollRestore.tsx` client component on the course page: owns `history.scrollRestoration = 'manual'`, persists the offset to `sessionStorage` (`learn365:course-scroll:<courseId>`) — debounced, plus a click-time freeze so navigation scroll-noise can't clobber it — and restores via a settle-aware rAF enforcement loop that beats the framework's deferred scroll-to-top. `sessionStorage` is view state (not the backend swap seam); fresh tab/session lands at top. New all-profile Playwright assertion. No content/schema changes.
- **Phase 7.5's scroll-collapse was reverted (2026-05-21).** On single-column lesson layouts (≤1024px) the sticky `LessonContextHeader` — top row (`Sadržaj` trigger + `Dan nnn / 365`) and meta row (era + `Pročitano nnn / 365`) — is now **always fully visible while scrolling**, per owner request (the collapse read as distracting). The `useScrollDirection.ts` hook was deleted and the CSS collapse rules removed; the header stays put via its existing `position: sticky`. See PROJECT_STATE → "Polish — Mobile lesson context header always visible (2026-05-21)".
- **Phase 7.12b** before that — the 8 era-opener lessons (Days 1, 46, 106, 151, 196, 231, 281, 341) each carry one curated figure at `content[1]` (between the dropcap paragraph and the second paragraph). Sources are Wikimedia Commons under PD-1923 / PD-Serbia / CC BY / CC BY-SA. 8 WebP assets at [`apps/web/public/lessons/era-{1..8}-{slug}.webp`](apps/web/public/lessons/) (1440 px wide max, ~1.5 MB total). Pure content pass — 8 additive JSON edits + regen, zero code changes.
- **Phase 7.11** before that — lesson bookmarks + `<CourseOverviewBookmarks>` surface (PR #21, `1fffe95`). New `@learn365/core/bookmarks` module mirroring the `progress` swap-seam pattern; toggle in `LessonHeader`; saved-lessons list on the course overview that renders nothing on empty.
- **Phase 7.10 + 7.12-a** before that — lesson trust scaffolding (`byline`, `lastReviewedAt`, `sources[]`) + figure renderer (`next/image` inside real `<figure>` + `<figcaption>`).
- **Phase 7.9** then collapsed the course-overview progress card to one canonical journey-day row.
- **Phase 7.8 + full-content corpus** sits behind it. Home carries the daily-ritual anchor; `validate-content` reports **365 authored / 0 placeholder**.
- **Codegen pitfall to know:** the runtime reads `packages/content/src/courses/istorija-srbije-365/_generated.ts`. Anyone editing `content/courses/*.json` must run `pnpm gen-content` to refresh the generated file — otherwise the app shows stale content.
- **UI/UX is at a stable baseline** the owner has declared the new floor. Do not regress below this state without an explicit owner decision.
- **No backend.** Progress lives in `localStorage` via `ProgressStorage` in `@learn365/core`; bookmarks (post-7.11) live in `localStorage` via the parallel `BookmarkStorage` adapter, separate `learn365:bookmarks:v1` key — both are the swap seams for the future .NET API.
- **No native mobile.** Responsive web only; `MobileLessonDrawer` is the mobile reading surface.

For the detailed surface-by-surface baseline (TopBar, Home, Course, Lesson reader, mobile, content loading, technical stack, era-opener figures), see `docs/PROJECT_STATE.md` → "Current Baseline — 2026-05-19".

---

## Carry-forward, non-blocking deferrals

Open since Phase 5 + Phase 7.10 + Phase 7.11 + Phase 7.12b + Phase 7.5 + Phase 7.6. None of these block new feature phases, but all should close before web v1 is declared "complete":

- **Production contact email** — swap the `CONTACT_EMAIL` placeholder in [`apps/web/app/o-aplikaciji/_copy.ts`](apps/web/app/o-aplikaciji/_copy.ts) once the real address exists. One-line change.
- **Screen-reader smoke** — VoiceOver / NVDA on TopBar nav + breadcrumbs + accordion + completion toggle + `<LessonSources>` block + bookmark toggle + `<CourseOverviewBookmarks>` cards + era-opener figure `<figcaption>` announcement (post-7.12b). Manual gate from Phase 5. (The post-7.5 sub-item about the `aria-hidden`-while-collapsed lesson meta row is now moot — the meta row is always visible and never `aria-hidden` as of 2026-05-21.)
- **Editorial review of the 6 authored seed lessons** ([`content/courses/istorija-srbije-365/lessons/`](content/courses/istorija-srbije-365/lessons/) Days 1, 7, 31, 106, 200, 305) for historical voice, accuracy, and period coverage. Manual gate from Phase 5.
- **Seed bylines** (post-7.10) — 6 one-line JSON edits adding `"byline": { "author": "…", "reviewer": "…" }` to the seed lessons once the editorial team is decided. Renderer is wired and shipped; absent because the "no generic fallback" rule means each byline needs a real per-lesson name. Effort: ~5 minutes per lesson.
- **Reading-progress hairline QA pass** (post-7.11) — Phase 7.11 plan §L6 reserved a manual check at 360 / 768 / 1024 / 1280 / 1920 widths and against the sticky TopBar z-index. Not driven yet because the component was already in production; QA confirms no surprise regressions.
- **Era-opener figure visual QA pass** (post-7.12b) — manual walk of all 8 era-opener lessons on the Vercel preview at 390 / 720 / 1280 to confirm no layout regression on neighbouring blocks, the dropcap on paragraph 1 stays undisturbed, the figure border-rule reads as editorial frame (not thumbnail outline), and the 8 captions ring as a coherent editorial set across periods. Sub-item: ensure no in-figure Cyrillic/Latin transliteration mismatch slipped into a caption.
- **Course scroll-restore visual QA pass** (post-7.6) — confirm on the Vercel preview that returning to `/course/...` (via browser back, breadcrumb `Kurs`, and TopBar `Kurs`) restores the offset with no jarring top→offset flash beyond ~1 frame, and that the motion reads calm at 390 / 768 / 1280. Sub-item: confirm the D2 accordion-shift (a different era may auto-expand on return) does not read as broken.

---

## Product review backlog (2026-09-25) — live next-step pointer

An owner-requested product review of the first-time experience (desktop + mobile, fresh `localStorage`) produced four ordered groups. Text of the lessons was explicitly out of scope. **All four groups are done (unmerged working tree, see PROJECT_STATE → "Polish — Core loop", "Polish — First impression", "Polish — Reader", "Polish — Course overview").** What remains from the review is owner input only: the real `CONTACT_EMAIL`, and a decision on whether the 963 kB first-load JS (the whole 365-lesson corpus ships to the client through the content package) is acceptable for v1 or should become a small follow-up. Standing assumption, accepted by the owner: "Dan" is a sequence number, not a calendar date.

1. **Core loop — done.** Resume rule (`findResumeLesson`), first-win moment after `Završi`, course-card start state without the empty `0%` ring, `Ukupno` → `Pročitano` everywhere.
2. **First impression — done.** `Kako funkcioniše` block on Home (first visit only) + on About, "Dan" explained as an ordinal, one-line hero title with the CTA above the fold, Open Graph / Twitter cards on every page with a static 1200×630 image, About copy no longer contradicts the product, "Premium" self-description dropped. **Left open:** `CONTACT_EMAIL` placeholder — needs the real address.
3. **Reader — done.** One-row sticky header (112px pinned on a 390px phone, was 150), breadcrumbs desktop-only with the era in the mobile eyebrow, trust line moved next to `Izvori`, era strip after the article on desktop (title at 260px, was 458), `LessonTimeline` ticks hidden on phones (no more colliding labels), `eraShort` in sidebar/drawer era rows. First paragraph on a 390×844 phone now starts at 526px (was 738).
4. **Small — done.** Era cards are a disclosure with one labelled action (`Počni` / `Nastavi` / `Pročitano`) that opens the era's first unread lesson; bookmark toggle labelled `Sačuvaj` with a tooltip pointing at the course page; `Poslednji pregled` next to `Izvori`; "Premium" dropped; "progress lives in this browser" stated in the how-it-works steps.

## Pre-Phase-8 UX backlog

The post-7.4 backlog was reframed on 2026-05-19 after an independent mobile UI/UX assessment. The full roadmap is in [`docs/ROADMAP_PRE_PHASE_8.md`](docs/ROADMAP_PRE_PHASE_8.md). Six bundles surfaced as Phases 7.7–7.12; the two pre-existing 7.5/7.6 polish items were preserved and are now both shipped. **Phases 7.7 (mobile nav), 7.8 (daily anchor), 7.9 (progress consolidation), 7.10 + 7.12-a (lesson trust scaffolding + figure renderer), 7.11 (lesson bookmarks + saved-lessons surface), 7.12b (era-opener figures), 7.5 (mobile sticky chrome scroll-collapse), and 7.6 (course page scroll restore) have all shipped.** No structured UX bundle remains.

*(Superseded on 2026-09-25 by the "Product review backlog" section above — work through its groups 2–4 first.)* **Earlier next pick: owner's call — the remaining backlog is all small/optional, or declare web v1 visually approved and move to Phase 8 (Backend).** Candidates, none blocking, in rough order:

- **`keyPeople` / `keyPlaces` rendering** (corpus fields added in 7.8 but unrendered anywhere). The most "phase-shaped" of the remainder: its own small consolidation phase deciding where in the reader / sidebar / header they appear and at what visual weight. Plan-before-code applies.
- **Hero backdrop QA pass** at 360 / 768 / 1280 / 1920. One-off check, not a phase.
- **Seed bylines.** 6 one-line JSON edits when editorial authors are decided (see Carry-forward).
- **Auto-regen `_generated.ts` on JSON edit** (husky pre-commit / `prebuild` / Turbo input dep). Small DX commit, not a UX phase — closes the manual `pnpm gen-content` foot-gun before the next content edit cycle.

If the owner declares web v1 visually approved instead, the roadmap moves to **Phase 8 — Backend (.NET 9 Web API + SQL Server + EF Core)**; the `ProgressStorage` / `BookmarkStorage` adapters in `@learn365/core` are the swap seams.

**Quality-of-life candidate surfaced by 7.8 (and reinforced by 7.12b):** auto-regen `_generated.ts` on JSON edit (husky pre-commit, a `prebuild` script, or a Turbo input dependency). The current manual `pnpm gen-content` step is a foot-gun if an author edits JSON without remembering to regen. Not a UX phase, but worth a small commit before the next content edit cycle.

---

## Roadmap continuation after the UX backlog closes

Once the remaining UX backlog is closed (or the owner declares web v1 visually approved), the roadmap continues with:

1. **Phase 8 — Backend (.NET 9 Web API + SQL Server + EF Core).** Plan: [`docs/BACKEND_STRATEGY.md`](docs/BACKEND_STRATEGY.md). The `ProgressStorage` adapter in `@learn365/core` is the swap seam — no v1 frontend rewrite required when the backend lands. `apps/api/` does not yet exist; it is introduced in this phase.
2. **Phase 8b — Native mobile (Expo).** Plan: [`docs/MOBILE_NOTES.md`](docs/MOBILE_NOTES.md). Built after backend so the mobile app can sync progress remotely. `apps/mobile/` and `packages/ui-mobile/` do not yet exist; they are introduced in this phase.

The web v1 codebase has been built with both swap seams already in place — backend via `ProgressStorage`, mobile via the `ui` / `ui-web` token-vs-component split. Neither phase should require rewriting v1 code.

---

## How to plan the next phase

1. **Walk the live build** — local `pnpm dev` or the Vercel preview. Use the desktop and mobile breakpoints. Trust the live read over any archived audit.
2. **Pick one bundle.** A phase is one PR with 1–4 commits, each one shippable in isolation. Phases that ship as feature bundles (7.0a–e, 7.2a–f, 7.4a–c) have been the cleanest unit.
3. **Write the plan as `docs/PHASE_X_Y_PLAN.md`.** Predecessor references, locked decisions, file list, gates, screenshot review plan. The Phase 7.4 plan (now in `docs/archive/phases/`) is a good template.
4. **Get owner sign-off on locked decisions** before writing production code. The "plan before code" discipline is in place — do not skip it.
5. **Ship**, then add a "Phase X.Y — done" entry to `docs/PROJECT_STATE.md` and move the plan file from `docs/` into `docs/archive/phases/` once merged.
6. **Update this `HANDOFF.md`** so the next session starts with current context.

---

## What NOT to do

- **Do not rebuild any of the baseline surfaces from scratch.** The current UI/UX is the new floor.
- **Do not start a new authentication, payments, or backend feature** without explicit owner direction — those are all v1-exclusions.
- **Do not consult `docs/archive/`** for current state. Archived plans describe the situation at the time they were written and are kept for archaeology only.
- **Do not edit production code as part of doc-only work.** Documentation passes should leave the working tree clean of code changes.
