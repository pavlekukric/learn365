# Product Review — Istorija Srbije 365 (2026-09-30)

**Reviewer:** Claude. Five parallel read-only passes covered: Home/Course/About/account pages and primitives; the lesson reader, shell and mobile; backend, auth, sync and ops; performance, SEO, code, DX and docs; the content corpus (full metrics plus a fresh 14-lesson editorial read). A production build was then walked with Playwright at 360 / 390 / 1440 / 1920 px in fresh and seeded states, and every claim used below was checked directly.
**Build reviewed:** `main` at `48707c0` (Phases 9–16 live on istorija365.com).
**Scope:** everything, the same as the 2026-09-28 review. Nothing was modified; this document and a pointer in `HANDOFF.md` are the only changes.
**Previous review:** [`PRODUCT_REVIEW_2026-09-28.md`](PRODUCT_REVIEW_2026-09-28.md), overall 7 / 10. Its whole engineering backlog (P0, P1 6–8 and 10–12, P2 13–18 and 20–22) has shipped since.

**Status (2026-09-30, morning):** every engineering item shipped overnight as Phase 17 (PRs #61–#65) — P0 1–5, P1 7–10, P2 12–19, and from P3 item 20 the brand rename and the About voice. Open: the content items (6, 11, 21–23), the controller's name (20), and the box-side steps of items 2 and 10 (HANDOFF → Owner steps). See PROJECT_STATE → "Phase 17".

---

## 1. Verdict

**Overall: 7.5 / 10 (was 7).** The engineering layer has moved from the weakest part of the product to one of its strengths:
- Client JS dropped from about 940 kB to 127–144 kB gzip per route, and 373 routes are prerendered.
- CI now gates every deploy, and deploys roll back on their own when the new release fails.
- Headers, `__Host-` cookies and a CSP are in place, and the cross-account merge is fixed.
- Vocabulary and day labels are consistent across the app, and the reader frame keeps its outline across lessons.

Every gate is green: typecheck, lint, 119 Vitest tests and the build. The walk found no JS errors and no horizontal scroll at any width.

**The biggest risk is now the content.** A fresh sample of 14 lessons turned up about one checkable slip per lesson: wrong dates, wrong attributions, a misstated court verdict and two grammar mistakes. Projected across the corpus, that is 250–350 slips, while only 6 of 365 lessons have sources and none has a byline. Nothing else in the product is as far below the "serious product" bar.

The rest is small:
- **Ops:** three S-sized gaps in the deploy/ops layer.
- **A11y:** a handful of accessibility slips.
- **CSS:** a stylesheet-order bug that silently cancels some design refinements.
- **Returning readers:** the Home page shows the first-visit version until the JS loads.

---

## 2. Scores

| Dimension                     | Before | Now     | Why                                                                                                                                                                                                                                                                  |
| ----------------------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual polish                 | 8      | **8**   | Coherent and editorial on every surface; the rail no longer truncates. The global type classes load after the module CSS, so some refinements never apply. For example, the hero renders at 104 px instead of the intended 91 px (§3, item 8).                                             |
| Clarity / IA                  | 7      | **8**   | One vocabulary (`pročitano` / `počni`), one day formatter, and "Tvoj N. dan" always matches `DAN nnn`. Secondary routes no longer mark `Početna` as active. Still open: the English brand next to a Serbian title, and English route segments next to Serbian ones.                                           |
| Premium feel                  | 7.5    | **7.5** | Home, About and Privacy are editorial. It is held back by the "History 365" brand, the mono `EPOHA I` / `0 / 45` tree on the course overview, and the newcomer version of Home flashing for returning readers.                                                                                    |
| Reading experience (desktop)  | 7.5    | **8**   | The width cap, the 40–80 px gutter and an outline that keeps its scroll and expansions are a real upgrade. Still open: an H2 sits the same 24 px below text as the gap between paragraphs, there is about 390 px of empty space right of the article at 1440 px, and the numerals-only era strip adds little.                                 |
| Mobile usability              | 7      | **8**   | All four complaints about the mobile header and stack are fixed: one counter, the era rail in the drawer, and the sign-in ask after the next-lesson card. The first sentence still starts at about 61 % of an 844 px screen, and the drawer and the ask have small edge bugs.                                             |
| Accessibility                 | 7      | **7.5** | `--faint` is now used only for decoration, `lang="sr-Latn"` is set and the named ARIA gaps are closed. Still open: completion state is not announced, the era strip links are named only "I…VIII", `aria-current="page"` is used in the wrong places, the skip link lands on the outline, and focus is lost on account delete. |
| Content — accuracy            | 7      | **6.5** | Nothing was re-dated or rewritten apart from the five P0 fixes. The new sample shows the slip rate is higher than the ~1 per 2 lessons estimated before (§3, items 1 and 6).                                                                                                                    |
| Content — voice & consistency | 8      | **8**   | Calm, balanced and aware of the myths. The structure is monotone (364 of 365 lessons have exactly one H2, 30 % start with "Kada", 4,914 em dashes, one quote). The Croatian residue is about 7 tokens, not hundreds (§6).                                                        |
| Content — coverage / arc      | 6      | **6**   | Unchanged. Still missing: Tesla, Pupin and Milanković; Montenegro in the 19th century; the Church after 1918; 1966 and 1968; Gazimestan 1989. The "present day" lesson stops at 2021–22.                                                                                                    |
| Content — trust signals       | 3      | **3.5** | The invented citation is gone and About honestly says the texts were prepared with AI and edited by one person. Only 6 of 365 lessons are sourced, none has a byline, and 6 have `lastReviewedAt`.                                                                        |
| Backend — security            | 7      | **7.5** | Headers, a CSP, `__Host-` cookies and an Origin check on every mutation. Still unapplied: the key's forced command, the rate limit and the secret rotation. The §13a runbook as written would not actually contain the key (§3, item 2).                                                  |
| Backend — data & privacy      | 5.5    | **7.5** | The shared-browser union is fixed properly (GET-replace plus an implicit sign-out), and there is a controller line and a real contact. The privacy text lacks a legal basis, transfer and complaint lines, and understates the timestamps kept. Backups are on the box only.                          |
| Operations                    | 5      | **6.5** | CI gate, self-rollback, a start-up that tolerates the database being down, and verified dumps. Against that: re-running an old CI run redeploys an old commit, a manual deploy can ship any branch, and a long database outage during a deploy can leave the schema unmigrated with no alert.                      |
| Performance                   | 5      | **8.5** | 127–144 kB gzip per route (was 940), 373 prerendered routes, a bundle budget in CI, and fonts preloaded in production. What remains is fonts fetched from Google at build time and 43 woff2 files.                                                                                   |
| SEO                           | 4      | **7**   | Canonical, sitemap and robots are in place and tested. Missing: lesson links in the course overview's server HTML, JSON-LD, 303 meta descriptions over 160 characters, and a canonical `/` on the 404.                                                                  |
| Code quality                  | 7      | **8**   | The duplication items are closed and the package seams are clean and strict. Left: the React/a11y lint does not reach `packages/ui-web`, lint is not type-aware, and a few duplicated constants.                                                                                  |
| DX / CI / tests               | 6      | **8**   | Drift check, e2e in CI, deploy gated on CI and a bundle budget. The e2e runs only on Chromium with accounts off, the budget ignores layout chunks, and the PROJECT_STATE baseline is stale again at 213 kB.                                                                   |
| Commercial readiness          | 5      | **6**   | The product and delivery are ready to charge for. The trust layer is not: no named reviewer, sources on 1.6 % of lessons, and a slip rate a careful reader will notice.                                                                                                   |

---

## 3. Priority list

Items are ordered by impact per unit of effort. Effort: S = hours, M = 1–3 days, L = a phase.

### P0 — Do now (all S)

1. **Fix the confirmed content slips (one commit + `pnpm gen-content`).** Each quote below was checked in the JSON:
   - `day-077`: "na Uskrs, 21. maja 1349." → "na Spasovdan" (Easter 1349 fell on 12 April).
   - `day-163`: Skopje was burned in late October 1689 by Piccolomini, not by Ludwig of Baden "početkom 1690".
   - `day-355`: the request for the ICJ opinion came in October 2008 → "iste godine".
   - `day-342`: Strugar was convicted under superior responsibility (failing to prevent or punish), not "za naređivanje".
   - `day-331`: "U dva navrata, u martu, aprilu i maju" → "u tri navrata". Separately, Bandung (1955, Yugoslavia absent) is not a non-alignment milestone "krajem decenije" → Brioni 1956 / Belgrade 1961.
   - `day-288`: "Carstvo je pao" → "palo".
   - `day-324`: "jevrejsko i ciganski pitanje" → "cigansko".

   Fix the leftovers in the same commit:
   - Croatian forms: `tisuću` (134), `stoljeće` (291), `obrambeni` (281), `pretkršćanskim` (40), `u glavnom` (179, 332).
   - `Geševov` → Gešov (281), `d'Espere` → d'Epere (297, 300), `Pocjorek` → Poćorek (292, 293).
2. **Contain the deploy key properly, then apply it.** `docs/DEPLOY.md:238` prefixes the key only with `command="…",no-pty,`. A forced command does not stop `ssh -N -L …:/var/run/docker.sock`, and `deploy` is in the `docker` group, so a leaked key is still root on the shared VPS, Računi included. `deploy/vps-install.sh:20` already adds `no-port-forwarding` and the others; only the runbook for existing boxes lacks them. Use `restrict,command="/srv/learn365/ssh-command.sh"` in both places, then the owner runs §13a. The Google secret rotation and `chmod 600 /srv/learn365/.env` are also still open: `vps-install.sh:25` never sets the mode, and DEPLOY §5 says it does.
3. **The deploy only ships the tip of `main`.**
   - `deploy.yml:13-17,33` deploys `workflow_run.head_sha` for any green CI run, and the known fix for the next/font flake is "rerun the job". Re-running commit A's CI after commit B is live silently rolls production back to A. Skip unless `head_sha` is the current `main` HEAD.
   - `workflow_dispatch` builds `github.sha` of any ref chosen in the UI and also pushes `:latest`. Add `if: github.ref == 'refs/heads/main'`.
4. **Stop reading the legacy session cookie.** `lib/server/auth/session.ts:52-55` still accepts the un-prefixed `l365_session` on https "for one release", and four releases have shipped since. This undoes the `__Host-` protection: someone who can set a cookie for `.istorija365.com` can sign a victim into the attacker's account, and the victim's local progress is unioned into it. Delete the fallback.
5. **The sign-in ask is spent on a lesson where it never shows.** `lib/auth/useSignInPrompt.ts:88-93` records "shown this session" as soon as `show` is true. `show` does not depend on whether the current lesson is completed, but the card renders only under a completed lesson. A reader with 2+ completions who opens an unread lesson from a link uses up the session's one ask without seeing it. Pass `isCompleted` into `isSignInAskDue`, or record the ask only when the card renders.

### P1 — Next (the biggest remaining wins)

6. **Historian pass plus a minimal trust layer (L, editorial; carries over item 9).** The fresh sample had medium-confidence slips on most lessons:
   - Day 20: Suetonius quoted as Augustus; 9 instead of 8 AD.
   - Day 288: "Prva tri" instead of "Prva dvojica".
   - Day 293: Belgrade liberated on 15, not 16 December; Austro-Hungarian losses far too low; the fall of Valjevo dated too early.
   - Day 233: Ljušić and Krestić presented as opposing voices.
   - Day 342: Ovčara 194, not "oko 260".
   - Day 355: March 2004, 19 dead, not "više od dvadeset".
   - Day 324: "nemačka" Specijalna policija, which was Serbian.
   - Day 349: the Račak framing borders on false balance.

   At this rate a review by one qualified reader is worth more than any engineering item. The trust layer:
   - Show one named reviewer.
   - Add per-era reading lists under lessons that have no `sources`.
   - Source the ~40 contested lessons individually.
   - Set `lastReviewedAt` only when a person has actually read the lesson.
7. **Returning readers see the newcomer Home until hydration (M).** The prerendered `/` contains `Počni kurs`, the whole `Kako funkcioniše` block and "Pred tobom je 365 dana" (checked in the HTML). A reader with progress sees that page first; then about 400 px collapses and the CTA changes to `Nastavi lekciju`, which is a layout shift on phones. The course overview does the same (the start card turns into the ring). Fix: a small inline pre-paint script that sets `data-progress="started"` on `<html>` from `localStorage`, plus CSS that hides the first-visit blocks. Alternatively, render those blocks only after hydration.
8. **The CSS cascade order silently cancels component styles (S, needs a screenshot pass).** `app/layout.tsx` imports `@learn365/ui-web` (whose barrel pulls in every component's CSS) before `./globals.css`, so single-class globals (`.display`, `.h3`, `.tiny`, `.mono`) override module rules on the same element. Measured: the Home hero is 103.7 px at 1440 px, but `.heroTitle` asks for `clamp(56px, 6.3vw, 92px)` ≈ 91 px. It still fits, but not by design. Also dead:
   - the TopBar mobile `.progressLabel`;
   - the CourseCard mobile title (19 → 22 px);
   - the letter-spacing on three eyebrows;
   - the serif numerals on the Home rail.

   Fix: import the globals first, or put the global type classes in `@layer`. The current look is the approved one, so compare before and after.
9. **Accessibility set (S each):**
   - **Completion state is silent.** `CompletionDot` is `aria-hidden` and `LessonNavItem` adds no text; add visually hidden ", pročitano".
   - **The era strip is named only by numerals.** The desktop lesson strip's links read only "I"…"VIII". Add a visually hidden era title, or decide D5 and drop the strip; the review recommends dropping it.
   - **The skip link lands on the outline.** On the lesson route it targets `<main>`, which starts with 15–30 outline controls; point it at the article.
   - **Wrong `aria-current` targets.** `aria-current="page"` is set on the last-opened row on the course overview, and on TopBar "Kurs" on lesson pages; the latter should be `"true"`.
   - **Focus is lost on account delete.** `Obriši nalog` unmounts the focused button; move focus to `Odustani`.
   - **Headings, English strings, the arrow.** Make the era cards `<h3><button>`. Translate `aria-label="Breadcrumbs"` and ProgressRing's "percent completed". Replace the literal `→` in `HomeHeroCta` with `iconRight`.
10. **Ops set (S–M):**
    - An off-box copy of the nightly dumps and one restore test (DEPLOY §10).
    - Report a pending migration in `/api/health`, and make `deploy.sh` wait on it. Today `migrate.ts:84-99` gives up after 40 × 15 s, while the healthcheck is `GET /`, which does not touch the database.
    - Widen the health wait in `deploy.sh`: about 60 s against a 30 s interval leaves two chances before a false rollback.
    - The Cloudflare rate limit (§13b).
11. **Day 361 — the "present day" lesson (owner decision, content).** It ends at the 2021–22 lithium protests. A course dated 2026 says nothing about the Novi Sad canopy collapse (Nov 2024) or the 2024–25 student protests, and a Serbian reader will notice. It is a politically live topic: either add a careful, sourced paragraph, or have the lesson state the date where it stops.

### P2 — Polish (S each; bundle into one or two PRs)

12. **SEO.**
    - The course overview's server HTML has 8 lesson links, because the tree renders only inside open accordions. Render it on the server (`<details>` or hidden `<ol>`s).
    - Add JSON-LD: `Course` + `Organization`, and `Article`/`LearningResource` + `BreadcrumbList` on lessons.
    - Cut meta descriptions at a word boundary at about 155 characters; 303 of 365 are over 160.
    - The 404 inherits `canonical: /` and the Home title (measured). Give it its own title, no canonical, and copy that does not claim "Lekcija ili kurs ne postoji" for every bad URL.
13. **Fonts.** Move to `next/font/local`. Each merge fetches Google Fonts three times (CI validate, CI e2e, Docker), which triples exposure to the known flake. Drop Spectral italic 300, which is unused.
14. **Lint and the budget.**
    - The React hooks + jsx-a11y rules cover only `apps/web`; `packages/ui-web` holds all the interactive markup and has neither. Move the block into a shared `react` export.
    - Consider `strictTypeChecked` for `no-floating-promises` in the sync engine.
    - `scripts/bundle-size.mjs` sums page entries, not the layout chain + page; count the full route.
15. **Reader polish.**
    - Give `.reader-h2` a top margin (heading rhythm).
    - Close the drawer on any link click, even to the current URL.
    - Stop auto-opened sections from piling up after several "next" clicks.
    - Close the drawer when the viewport grows past 1024 px.
    - Check in the browser whether the new lesson's title can land under the sticky chrome after a small scroll (unverified).
16. **Privacy page completeness (with the owner).**
    - Add the legal basis, the transfer note (Cloudflare and Google are US processors) and the right to complain to the Poverenik.
    - "Četiri stvari" leaves out `created_at` / `last_seen_at` / `completed_at`.
    - `find -mtime +14` actually keeps 15–16 days, not 14.
    - `/prijava` says Google gives "ime, e-adresu i sliku", while `/privatnost` lists four things.
17. **Docs.**
    - The PROJECT_STATE "Current Baseline" is wrong again: "last shipped Phase 15", routes `/kurs/…/lekcija/…`, `lessons/authored/`, "41 tests", fonts "from Google", and headings "done (unmerged)".
    - Cut the baseline to one page and move the phase log (lines 73–1534, 213 kB total) to `docs/archive/`.
    - In `HANDOFF.md`, "Where the app is right now" still lists "Core loop polish … unmerged" and "Phase 7.6 just shipped".
18. **Code crumbs.**
    - `DEFAULT_COURSE_ID` is defined in 4 files.
    - Six routes inline `jsonNoStore({error:'unavailable'},503)` instead of `apiUnavailable()`.
    - The bookmark routes import from `progress/validation`.
    - `CourseOverviewEras.tsx:139` subscribes to the whole store; `:228-236` calls `setState` inside a state updater.
    - Unused exports: `eraProgress`, `sectionProgress`, `bookmarkCount`, `getEraById`, `getEraForSection`, `getSectionById`.
    - `not-found.module.css` and `account.module.css` duplicate `.wrap` / `.card` / `.secondary`.
19. **Tests.**
    - An accounts-on e2e project (PGlite + a stubbed Google token endpoint) covering sign-in, sync, `/nalog` delete and `/pregled` with an admin.
    - A nightly WebKit run.
    - An axe pass over the main routes.

### P3 — Owner and editorial, longer horizon

20. **Brand and About voice (carries over item 19).**
    - Masthead, footer and every tab title say "History 365" on a Serbian product at istorija365.com.
    - About speaks as "we" ("Pišemo", "proveravamo", "Cilj nam je"), while the same page says one person runs the site and the texts were prepared with AI.
    - Its lede repeats the Home hero line.
    - "Privatno lice" does not name the controller.
21. **Coverage (carries over item 23).**
    - Tesla / Pupin / Milanković, 19th-century Montenegro, the Church after 1918, Brioni 1966 and 1968, Gazimestan 1989, and women after 1400.
    - The 9th–12th centuries are still two lessons (46–47) filed in Era II with `year: 1166`.
    - Correction to the previous review: the siege of Sarajevo (342) and Goli otok (331) *are* covered.
22. **Voice and timeline data (carries over items 24–25).**
    - Voice: vary the structure; add short attributed primary-source quotations.
    - Spelling: settle `Habsburšk` / `Habzburšk` (10 vs 50 lessons) and `Austro-Ugarsk` / `Austrougarsk` (24 vs 32); fix the „…“ closing quotes in 17 lessons.
    - Timeline data: 45 within-era `year` regressions; the era year fields disagree with the labels (III `yearEnd` 1499 vs 1459, V/VI overlap, VIII ends 2030, Era I label "9. vek" vs `yearEnd` 1165). Home shows "9500 p.n.e." on desktop and "praistorija – 9. vek" on the phone for the same era.
23. **Unused fields (carries over item 26).**
    - `keyPeople` / `keyPlaces` / `timelinePosition` are still not rendered.
    - `timelinePosition` equals `dateLabel` on 275 of 365 lessons, and `keyPeople` is empty on 64.
    - Render them or drop them.

---

## 4. What is right and must be protected

- **Delivery.** The server-only article split is enforced three ways: the `server-only` import, `LESSON_ARTICLE_KEYS`, and the CI budget. There are 373 prerendered routes, and the reader is a server component with three small islands.
- **The persistent lesson shell.** It adjusts state during render instead of in effects. Reveal scrolls only the outline list, never the page; it jumps on first load, glides afterwards and respects reduced motion. The drawer has a focus trap, Escape and focus restore. Tracing prev/next found no stale state.
- **One vocabulary, one day formatter, one resume rule, and an honest reading time computed from the corpus.**
- **Auth and privacy.**
  - The auth flow: PKCE plus state in a `__Host-` cookie, checked ID token claims, and hashed 256-bit sessions.
  - Request safety: an Origin / `Sec-Fetch-Site` check on every mutation, and idempotent deltas.
  - Data handling: cascading delete, `no-store` on the API, and no PII in the logs.
  - `/pregled`: a 404 for everyone except the owner, and `is_admin` never reaches the browser.
- **The gate.** Drift check, lint, typecheck (e2e included), tests, build, budget and parallel e2e run before every deploy of the validated SHA, and a failed release rolls back on its own.
- **The content's register.** Day 115 separates the historical from the cultural Kosovo. Day 324 on the Holocaust does not look away. Days 342 and 349 say "nije sve isto" and name victims on every side. The historian pass must fix facts without flattening this voice.
- **The About disclosure** (AI plus one editor). It is rare and it builds trust; the rest of the page's voice should match it.

## 5. Measurements behind the scores

| What | 2026-09-28 | 2026-09-30 |
| --- | --- | --- |
| Client JS per route (gzip, layout + page) | ~940 kB | 127–144 kB |
| Prerendered routes | 5 | 373 |
| Gates at HEAD | — | typecheck ✓ · lint ✓ · Vitest 119/119 ✓ · build ✓ |
| Playwright walk (4 widths × fresh/seeded, 12 routes) | — | 0 JS errors, 0 horizontal overflow; 404s answer 404 |
| Home hero font-size @1440 | — | 103.7 px (intended ≈ 91 px) |
| Lesson words min / median / max | 659 / 843 / 1038 | 640 / 844 / 1038 |
| Blocks | 2,855 p · 364 H2 · 8 img · 1 quote | unchanged |
| `sources` / `byline` / `lastReviewedAt` | 6 / 0 / 6 | 6 / 0 / 6 |
| Checkable slips in the editorial sample | ~1 per 2 lessons (12 read) | ~1 per lesson (14 read; 8 high-confidence) |
| Within-era `year` regressions | "91" | 45 (strict), re-measured |
| "pošteno je reći" | "48" | 16 lessons (the whole "pošten-" family: 134) |
| Croatian residue (tisuću / stoljeće / obrambeni / pretkršćanskim / u glavnom) | "134 / 291 / 281 / 40 / 179" | 1 / 1 / 1 / 1 / 2 occurrences — the old figures were lesson numbers |
| Summaries > 160 chars (used as meta description) | 303 | 303 |
| PROJECT_STATE.md size | 163 kB | 213 kB |

## 6. Findings tested and rejected, and corrections

- **"Fonts are not preloaded" (raised by the perf pass from a local build).** Rejected. Production `https://istorija365.com/` carries `<link rel="preload" as="font" … .woff2>` for the preloaded faces. The local build had been restored from the turbo cache without the font manifest entries.
- **"The Home hero overflows its column at 1440 px."** Rejected as an overflow: the title is 104 px instead of 91 px and `nowrap`, but it still fits the 960 px column (scrollWidth = clientWidth = 960). The cascade bug itself is real (item 8).
- **Corrections to the 2026-09-28 review.** The residue counts in its item 24 were lesson numbers, not occurrences (about 7 tokens in total). The regression count was 45, not 91. Sarajevo and Goli otok are covered.

## 7. Method

Five independent read-only passes, each given the 2026-09-28 review and asked to classify every prior item as fixed, partial, not fixed or regressed before looking for new issues. After that:
- a production build (`next build`, Next 15.5.18) walked with Playwright at 360×740, 390×844, 1440×900 and 1920×1080, fresh and with 41 lessons seeded, over 12 routes, plus a prev → next navigation inside the lesson shell;
- direct checks of every P0 claim: the lesson JSON quotes, `DEPLOY.md:238` vs `vps-install.sh:20`, `deploy.yml` triggers, `session.ts` legacy read, `useSignInPrompt.ts` recording;
- a check of the rejected font claim against production HTML;
- the computed hero font size.

No production traffic other than one GET of `/`, and no changes other than this document and a pointer in `HANDOFF.md`.
