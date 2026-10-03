# Product Review — Istorija Srbije 365 (2026-10-03)

**Reviewer:** Claude. Five parallel read-only passes:

1. Visual design and UX: Playwright at 360 / 390 / 1440 / 1920 px. Walked as a fresh reader and as a returning reader, plus three edge states: a gap in progress, only Day 365 read, and all 365 read.
2. Lesson reader, shell and accessibility: code read, 42 axe scans and a keyboard walk.
3. Backend, accounts, sync, security and ops: code read, Vitest, the accounts-on e2e suite (7 / 7) and a probe test against Phase 23 sync.
4. Performance, SEO, code and docs: Lighthouse 12.8 (mobile + desktop, 3 runs each), HTML / JSON-LD inspection, gates.
5. The content corpus as a product: the 10-01 metrics script re-run, plus a fresh editorial read of 13 lessons across all 8 eras.

The merger re-checked the headline claims directly in code:

- the completion scroll on load (`LessonFooter.tsx:73-83`);
- the marker listener (`AuthProvider.tsx:119-126`);
- `set_tag` before `pull` (`deploy.sh:99-101`);
- the absent `permissions:` in `ci.yml`;
- the sync test coverage. Pass 4 said the queue and journal have no tests. That is wrong: they are covered through `syncEngine.test.ts` and `storeSync.test.ts`, though neither has its own test file.

**Build reviewed:** `main` at `8dd9076`, after Phases 21–23.
**Limitation:** the sandbox's network policy denies `istorija365.com`, so every pass ran against a local production build (`next start`, accounts off; accounts on in the e2e suite). Lighthouse numbers are therefore localhost numbers: no latency and no Cloudflare. The box was not checked.
**Scope:** everything. Nothing was modified. This document is the only change.
**Previous review:** [`PRODUCT_REVIEW_2026-10-01.md`](PRODUCT_REVIEW_2026-10-01.md), overall 8 / 10. Since then:

- Always Use HTTPS (owner);
- Next 15.5.27 and sharp 0.35.5;
- Phase 21: progress tree, resume rule, reader polish, focus / ARIA;
- Phase 22: fonts;
- Phase 23: sync queue.

The content has not been touched since that review (`git log 2c1d187..HEAD -- content` is empty).

**Evidence:** the per-pass reports, screenshots, Lighthouse JSON and the metrics script are in the session scratchpad, outside the repo. Every finding below carries its own evidence.

---

## 1. Verdict

**Overall: 8 / 10, held. Engineering and UX rose, content stood still.**

The 10-01 engineering P1s are closed:

- **Progress tree and copy:** the tree row is current _and_ read; Home, the overview and the outline name the same lesson; copy follows position; 365 / 365 ends with „Kurs je završen.”
- **Reader:** paragraphs are 24 px apart (were about 60), and `Označi kao pročitano` is 48 px tall and full width on phones.
- **Focus:** focus moves to the new h1 after every lesson change, and the page behind the drawer is `inert`.
- **Fonts:** 2 preloads (48 kB) instead of 12 (about 295 kB). Local mobile Lighthouse is 92–97 (was 61–83 on production).
- **Sync:** the six loss paths are closed; the accounts e2e suite passes 7 / 7.
- **Checks:** axe reports 0 violations in 42 scans, with best-practice rules on. There are no JS errors and no horizontal scroll at any width. Vitest passes 316 / 316, and the code has 0 `any`, 0 `!` and 0 suppressions.

**What holds it at 8:**

- **A new reader bug (P1).** Opening a lesson you have already read by URL scrolls the page straight to the completion footer. This covers a reload, a new tab, a bookmark and the sitemap / search entry. Measured: scrollY 2781 at 1440, and 3271 of 4392 at 390. It has been there since Phase 15 and no test covers it.
- **Content is exactly where 10-01 left it:**
  - The language has about 1.8 slips per lesson.
  - Every quoted slip from 10-01 is still there.
  - A non-standard word sits in a menu-visible title (Day 119 „Knjeginja Milica”).
  - The trust layer is still hidden: `sources` 6, `byline` 0, `lastReviewedAt` 6, all dated 19.05.2026. The real checking happened in September–October.
  - About still says the reading list is „u pripremi”.
- **One cross-account path is left in sync.** It needs a cookie for a different user set without `Odjava`. A probe wrote X's tab's change into Y's account.
- **The 10-01 P2 polish is almost all undone:**
  - images and caching;
  - SEO, 0 of 5 items;
  - `lessonHref()`;
  - doc drift;
  - the mobile overview;
  - CI supply chain.

## 2. Scores

| Area                     | Score | 2026-10-01 | One line                                                                                                                                     |
| ------------------------ | ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual design + UX       | 8     | 7.5        | Polish 8.5, premium 8, IA 8.5, mobile 7.5; tree and copy now honest. Desktop header (~500 px before the text) and the mobile overview remain |
| Lesson reader + shell    | 8.5   | 8.5        | Every edge state right; the completion scroll on load is the one real bug                                                                    |
| Accessibility            | 8.5   | 8          | 0 axe in 42 scans, h1 focus hand-off, inert drawer; live regions announce 0 → N on load; no screen-reader pass by a person                   |
| Backend + security + ops | 7.5   | 7.5        | Security 8, data 8, ops 7. Sync is much safer; one cross-account path, CI supply chain and `deploy.sh` ordering open                         |
| Performance              | 8.5\* | 7          | \*Localhost only: mobile 92–97, desktop 100, CLS ≈ 0. Production not re-measured                                                             |
| SEO                      | 7.5   | 8          | Basics fine; none of the 10-01 SEO set shipped; breadcrumb JSON-LD repeats one URL three times                                               |
| Code + DX                | 8.5   | 8.5        | Very clean; Lighthouse job now the slowest CI job and on the deploy path; Prettier not in CI                                                 |
| Docs                     | 6.5   | (in code)  | HANDOFF / PROJECT_STATE carry stale lines; 10-01 doc drift untouched                                                                         |
| Content as product       | 7     | 7          | Accuracy 8.5, language 6.5, voice 8, coverage 6, trust 3.5, all unchanged                                                                    |
| **Overall**              | **8** | 8          |                                                                                                                                              |

## 3. Status of the 10-01 list

| 10-01 item                            | Status                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P1 1 Always Use HTTPS                 | Done (owner) — not re-verifiable from here                                                                          |
| P1 2 Next / sharp                     | Done (15.5.27 / 0.35.5). Dependabot + audit step **open**                                                           |
| P1 3 Fonts                            | Done in code and CI; **production re-measure missing** (PROJECT_STATE line 50 points to a number that is not there) |
| P1 4 Sync loss                        | Done; one residual path (P1-B 2 below)                                                                              |
| P1 5 Progress tree                    | Done                                                                                                                |
| P1 6 Reader polish                    | Mostly done; the desktop header height is open                                                                      |
| P1 7 Day 1 figure                     | **Open** (still 1440×1080 in 28.6 kB, and it shows a floor close-up that does not match its alt text)               |
| P1 8 Proofreading                     | **Open**                                                                                                            |
| P1 9 Trust layer                      | **Open**                                                                                                            |
| P2 10 Mobile overview                 | **Open** (3709 px fresh)                                                                                            |
| P2 11 Focus / ARIA                    | Done (`Ne sada` verified in code only)                                                                              |
| P2 12 Images / caching                | **Open**                                                                                                            |
| P2 13 Rate limit                      | **Open** (owner)                                                                                                    |
| P2 14 SEO set                         | **Open**, 0 / 5                                                                                                     |
| P2 15 Serbian routes / `lessonHref()` | **Open** (13 hand-built URLs in 12 files)                                                                           |
| P2 16 Doc drift                       | **Open**                                                                                                            |
| P2 17 Content metadata                | **Open**, numbers identical                                                                                         |
| P2 18–19 Factual slips / balance      | **Open**, all quotes still present                                                                                  |
| P2 20 Off-box prune                   | Open (only matters once switched on)                                                                                |
| P3 21–22 Coverage / template          | Open                                                                                                                |
| P3 23 CI supply chain                 | **Open**                                                                                                            |
| P3 24 Session hygiene                 | Open                                                                                                                |
| P3 25 Shell details                   | Mostly open (see P3 below)                                                                                          |

## 4. Priority list

Effort: S = under an hour, M = half a day, L = more.

### P1 — Next

1. **Do not jump to the footer on load (S).**
   - Today, `wasCompletedRef` starts as `false` during hydration, before the store rehydrates. The false → true edge then fires the "just completed" `scrollIntoView` on every visit to a read lesson.
   - Fix: scroll only after a toggle the reader made. Pass an `onToggle`-set flag, or gate the effect on the store having hydrated.
   - Test: an e2e that reloads a read lesson and expects scrollY 0.
2. **Close the last cross-account sync path (S–M).**
   - The holes:
     - `AuthProvider` re-asks `/api/me` only when a marker is _removed_, not when it is overwritten with another user.
     - The engine keeps `activeUser` (`syncEngine.ts:187`).
     - The server takes the user only from the cookie (`progress/route.ts:33`).
   - Fix:
     - re-ask on a marker change;
     - send `X-Sync-User` and have `guardApi` answer 409 on a mismatch;
     - add one accounts e2e case.
3. **Proofreading pass + house style sheet (M per era; Claude drafts, the owner approves).** Unchanged from 10-01 item 8, plus:
   - the Day 119 title („Knjeginja” → „Kneginja”, also in Day 90);
   - the wrong closing quote, which is “ (U+201C), not ASCII: 44 occurrences in 16 lessons, a mechanical fix;
   - Habsburšk- (8) / Austrougarsk- (13) against the majority forms;
   - Pazvantoğlu / Nizam-ı (186) against Pazvan-Oglu (189);
   - new slips from the fresh read: 209 „okrene preča sebi”, „otvoren leđa”; 168 „pomerajni”; 89 „prepleve”; 262 „lyceum”, „pančićevu”; 333 „Bilanca”; 37 „Justinijan ga je pokušao da pretvori”; 194 „povratak ono dvoje”;
   - add an automated wording check to `validate-content`: no space after a year, “, ğ / ı, ijekavian forms.
4. **A truthful trust layer (S–M; the owner approves the wording).** As 10-01 item 9, plus three concrete defects:
   - the 6 lessons show „Poslednji pregled: 19.05.2026”, which undersells the real September–October passes;
   - About still says the reading list is „u pripremi” and that only some lessons were checked several times. Both are now false.
   - Day 365 and 22 lesson files address the reader as _vi_, while the app uses _ti_.

   `docs/review/druga-provera` already names the sources for per-era reading lists: Srpska enciklopedija, Leksikon CANU, Ćorović and the ICTY judgments. Add a „Prijavi grešku” mailto in the reader.

5. **Day 1 figure (S, asset).** Unchanged from 10-01. Re-export at ≥ 1320 px, or pick a Commons image that matches the alt text.

### P2 — Polish (bundle by theme)

6. **Reader + Home copy set (S, one PR):**
   - the desktop lesson header: the first sentence sits at y 614–645 of 900. Zero the h1 / lede margins on desktop too (`LessonHeader.module.css:39-46`) and slim the 214 px timeline band;
   - „Kako funkcioniše” says „prvu nepročitanu”, but the rule is "after the last read";
   - with 365 / 365 read, Home still says „TVOJ 365. DAN”;
   - when the course is finished, every footer says „Kurs je završen.” with no next link, so a re-reader cannot walk forward (`completionMoment.ts:39` → `CompletedFooter.tsx:99`);
   - a new reader's Home shows the start button twice.
7. **Live regions (S):**
   - The completion status region renders already filled, so screen readers often skip it (`CompletedFooter.tsx:79`). Use one persistent, empty polite region instead.
   - Drop `role=status` from the TopBar and context-header counters, which announce 0 → N on every load.
8. **Mobile course overview (M).** Unchanged from 10-01 item 10: stack the era label above the card under 720 px (`CourseCard.module.css:193`).
9. **SEO + images (S–M, one PR):** the 10-01 items 12 + 14, all still open:
   - `og:type=article` on lessons;
   - breadcrumb JSON-LD with real era / section URLs;
   - `lastmod` / `dateModified` taken from git;
   - `og:url` on noindex pages;
   - per-era share cards;
   - an `images` block with `minimumCacheTTL` and AVIF;
   - the 570 kB era-6 figure;
   - capped portrait figures.
10. **CI and supply chain (S, one PR):**
    - Move the warn-only Lighthouse job off the deploy path. It takes 3 m 23 s and is now the slowest job, so CI went from about 2 to about 3.4 min. Run it nightly or on PRs only, or let deploy wait on validate + e2e only.
    - Add `permissions:` to `ci.yml` and pin actions by SHA.
    - Stop re-pushing `:latest`.
    - Add Dependabot and a non-blocking `pnpm audit --prod`. Today it shows 4 high and 2 moderate, all build-time PostCSS / nanoid.
    - Add `prettier --check`, after one format commit: 322 files differ.
11. **`deploy.sh` ordering (S, then the owner copies it).** Today `set_tag` runs before `pull`, with no error trap (`deploy.sh:99-101`). If the pull fails, `.env` names an image that never ran and nothing rolls back. Write the tag after a successful pull, under a `trap`.
12. **Doc drift (S).** As 10-01 item 16, plus:
    - HANDOFF still lists two owner steps that the owner declined (the secret rotation and the controller's name), and two UI items that Phase 21 fixed.
    - PROJECT_STATE's baseline header still says 2026-09-30 / Phase 18 and lists the historian pass as open.
    - PROJECT_STATE also points at a production Lighthouse number that does not exist.
13. **`lessonHref()` (S), then Serbian routes (M).** Unchanged from 10-01 item 15.
14. **Content metadata, factual slips and balance (S each).** 10-01 items 17–19 are unchanged. New, not researched:
    - Day 19 dates the first clashes two ways;
    - Day 131 has „krajem 1438” before „leta 1438”;
    - Day 209 says „sedam godina ratovanja” for 1804–1812;
    - balance: Day 318 frames the April War around Croat and Slovene desertion.
15. **Rate limit (owner, §13b).** Still open:
    - `/api/health` queries the database without sign-in, against a 5-connection pool.
    - `readJsonBody` reads the whole body before checking its size when no Content-Length is sent. Cap it while streaming.

### P3 — Later / owner

16. **Sync ordering:**
    - A stale toggle can win across devices or across adopted queues. Offline queues now live indefinitely, so a phone coming back online can undo a newer laptop change.
    - Add per-id timestamps, or have the server ignore an older "uncomplete".
    - Smaller edges:
      - a permanent 400 / 413 retries forever;
      - a 401 never reaches the UI;
      - per-tab queue keys pile up during a long outage;
      - every page holds a Web Lock, which may cost the bfcache in Chrome. Check this in real DevTools.
17. **Session hygiene:** unchanged from 10-01 item 24.
18. **Shell details**, left over from 10-01 item 25:
    - eras in the outline never close (`LessonShell.tsx:95-97`);
    - closing the drawer by resizing drops focus to `<body>`;
    - phones get two skip links;
    - breadcrumb era / section links open Day 1 (`page.tsx:143,146`);
    - the desktop hero's empty right half.

    New:
    - the `Sadržaj` trigger is 33.5 px tall;
    - the desktop skip link lands above the breadcrumb;
    - the Home rail reads „p.n.e..”;
    - two sticky bars take 114 px on a phone lesson;
    - the overview's progress card is very wide and mostly empty;
    - About's step titles run into their text;
    - „pregled” is used as a timeline marker.

19. **Performance tail:**
    - 4 render-blocking stylesheets;
    - Home's LCP is still the decorative hero background;
    - JetBrains Mono loads above the fold on Home (5 font files, 111 kB, on first view);
    - a CLS of 0.02 on Day 150 from a late font swap;
    - the lesson route is 149.4 kB gzip (was 145; budget 175).
20. **Coverage and template (L / M, editorial).** As 10-01 items 21–22:
    - Tesla, Pupin, Milanković, Nevesinje and Gazimestan still get 0 mentions. Day 262 (scientists trained abroad) is the natural place for Tesla and Pupin.
    - Day 360 is a catalogue of names that does not earn its 6 minutes, so it is a swap candidate with 105 and 194 / 195.
    - Add real primary-source quotes: Prokopije in Day 37, Article 8 in Day 209.
    - 36 lessons end on a „Treba / Vredi / Ostaje…” paragraph.

### Owner steps (from HANDOFF, not re-checked: no box access from this sandbox)

- the deploy key `restrict,command=…` (§13a);
- copying the new `deploy.sh` / `backup.sh` (§9). Ideally do this after item 11 lands, so it is copied once;
- the Cloudflare rate limit (§13b);
- the off-box backup and one restore test (§10).

## 5. What is right and must be protected

- **The persistent shell:**
  - the server-rendered article with three client islands;
  - the h1 focus hand-off after every lesson move;
  - the inert walk with its focus trap, Escape and focus return;
  - CLS ≈ 0;
  - the returning-reader pre-paint.
- **The single resume rule and the two-flag tree row.** Home, the overview and the outline now agree, and the copy follows position.
- **Sync:**
  - ack-by-subtraction stays correct for complete → uncomplete → complete while a request is in flight;
  - other accounts' queues are never sent;
  - the memory fallback covers a full or blocked `localStorage`.
- **Sign-in:** OAuth code + PKCE with state, the `__Host-` HttpOnly cookie, Origin checks on every write, and `/api/health` answering 503 until migrations are applied.
- **The font pipeline and its guards:** subsets, 2 preloads, a budget in `check-bundle`, and a unicode-range test.
- **Code discipline:** strict types, 316 tests and self-rolling-back deploys.
- **The calm, two-sided voice and the honest ranges,** for example Days 131, 168, 186, 262 and 333. Proofreading changes words only.
- **The `docs/review/` trail and the rule of no invented bylines.** Together they are the raw material for the trust layer.

## 6. Measurements

| Route (localhost) | Mobile LH | Desktop LH |
| ----------------- | --------- | ---------- |
| Home              | 92–96     | 100        |
| Course overview   | 94–96     | 100        |
| Lesson day-001    | 95–97     | 100        |
| Lesson day-150    | 95        | 100        |

- Accessibility, Best Practices and SEO scored 100 in all 24 runs.
- Localhost has no network latency or CDN; production on a mid-range phone will be lower. Re-measure on production before calling P1 3 closed.
- **Bundle:** 127–149 kB gzip per route (budget 175); font preloads 2 files / 47.9 kB (budget 2 / 64 kB).
- **Gates:** typecheck, lint, Vitest 316 / 316, validate-content, build and check-bundle all pass. Accounts e2e: 7 / 7.
- **axe:** 0 violations in 42 scans: 10 pages × 1440 / 390 × fresh / returning, plus the drawer open.
- **Corpus:** identical to 10-01:
  - median 850 words;
  - 305 summaries over 160 characters;
  - 26 non-date `dateLabel`s;
  - 64 empty `keyPeople`;
  - 25 backwards years;
  - 363 lessons with one H2;
  - 1 quote;
  - 109 lessons opening with „Kada”;
  - `sources` / `byline` / `lastReviewedAt` 6 / 0 / 6.

  Fresh read: 23 slips in 13 lessons.

## 7. Method and suggested order

- Each pass wrote a scored report with severity, effort, evidence and a fix. Each was told not to re-report fixed items unless they had regressed, and to state the status of every 10-01 item in its scope.
- The content pass did not repeat fact-checking (Phases 19–20). Its incidental slips are listed unresearched.
- No pass changed the repo or touched the box.
- **Suggested order:**
  1. P1 1 + P2 6 + 7 as one reader PR (S–M);
  2. P1 2 (sync);
  3. P2 10 + 11 (CI / deploy; then the owner copies `deploy.sh`);
  4. P2 12 (docs);
  5. P2 9 (SEO + images);
  6. the content items P1 3–5 as the owner chooses, era by era.
