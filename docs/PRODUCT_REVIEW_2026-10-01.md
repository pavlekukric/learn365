# Product Review — Istorija Srbije 365 (2026-10-01)

**Reviewer:** Claude. Five parallel read-only passes:
1. Visual design and UX of the live site: Playwright at 360 / 390 / 1440 / 1920 px, fresh and returning reader, 80 page loads.
2. Lesson reader, shell and accessibility: code read, 19 live axe scans, keyboard walk.
3. Backend, accounts, sync, security and ops: code read plus read-only HTTP probes.
4. Performance, SEO, code and docs: Lighthouse 12 on production, local gates.
5. The content corpus as a product: metrics script plus a fresh editorial read of 15 lessons.

The merger re-checked the headline claims directly: plain-http 200, Next 15.5.18 in the lockfile, 12 font preloads on Home, `LessonNavItem` single-valued state, six quoted grammar slips, Tesla absent, and the box state (old `deploy.sh` / `backup.sh`, deploy key without `restrict`, `.env` 600).

**Build reviewed:** `main` at `309bc2b`, with Phases 17–20 live and Hetzner Backups on since 2026-10-01.
**Scope:** everything. Nothing was modified. This document and a pointer in `HANDOFF.md` are the only changes.
**Previous review:** [`PRODUCT_REVIEW_2026-09-30.md`](archive/reviews/PRODUCT_REVIEW_2026-09-30.md), overall 7.5 / 10. Its whole engineering backlog shipped as Phase 17. The content risk it named led to Phases 19–20: a fact-check of all 365 lessons and a second-source pass, about 900 fixes in total.

**Per-pass evidence:** the five pass reports, Lighthouse JSON and screenshots were kept outside the repo (session scratchpad). Every finding below carries its own evidence (file:line, URL + width, or quote).

---

## 1. Verdict

**Overall: 8 / 10 (was 7.5).** The facts are no longer the weak point:
- Every lesson was fact-checked.
- Every Wikipedia-only finding was re-checked against two other sources, and nothing open is left.

Engineering held up:
- 0 JS errors in 80 live loads and no horizontal scroll at any width.
- axe reports 0 violations in 19 scans.
- Strict TypeScript, with no `any`, `!` or lint suppressions in about 23k lines.
- 300 / 300 Vitest tests, and CI takes about 2 minutes.

Nothing has regressed in UX since 2026-09-30.

**What holds it below 9:**
- **Mobile speed fell:**
  - Lighthouse mobile is 61–83, below the Phase 5 floor of 82–85.
  - The cause is the font move: 12 font preloads (about 295 kB) on every page. With fonts blocked, Home scores 80–81 and a lesson 82–85.
  - Nothing in CI watches for this, so the drop went unnoticed.
- **Security hygiene:**
  - The site still answers on plain `http://` with the full page.
  - Next 15.5.18 is behind security releases (`pnpm audit --prod`: 2 critical, 4 high, fixed in 15.5.21–15.5.24; sharp needs ≥ 0.35.4).
- **Signed-in progress can silently go missing.** This happens on reload of a lesson, during a database outage, when going offline and closing the tab, and across two tabs. The two-tab path reopens the cross-account merge that 2026-09-30 called fixed.
- **The progress tree misreports itself:**
  - The lesson you are on never shows as read.
  - The course overview names two different "you are here" lessons.
  - Completion copy counts instead of looking at position, so reading Day 365 first says "Prvi dan je iza tebe".
- **The content's next layer:**
  - The Serbian has about 2 slips per lesson.
  - Readers see no sign of how the text was checked: `sources` appears on 6 lessons, `byline` on none.
  - The coverage gaps are unchanged: Tesla, Pupin and Milanković get 0 mentions, and no woman has a lesson after 1400.

## 2. Scores

| Area | Score | 2026-09-30 (its dimensions) | One line |
|---|---|---|---|
| Visual design + UX | 7.5 | polish 8, premium 7.5, IA 8 | Premium palette and type, a resume loop that works; held back by tree state, spacing and the mobile overview |
| Lesson reader + shell | 8.5 | desktop 8, mobile 8 | Server-rendered reader with three client islands; every edge state renders |
| Accessibility | 8 | 7.5 | 0 axe violations; focus drops to `<body>` after lesson moves; no screen-reader pass yet |
| Backend + security + ops | 7.5 | security 7.5, data 7.5, ops 6.5 | Sign-in/session sound (CSRF probes 403); http, Next advisories, sync loss, no rate limit |
| Performance | 7 | 8.5 | Desktop 90–99, CLS 0 everywhere; mobile 61–83 because of fonts and the hero background |
| SEO | 8 | 7 | Last review's items shipped; plain http, generic share card, stale `lastmod` |
| Code + DX + docs | 8.5 | code 8, DX 8 | Very clean code; doc drift (COMPONENT_LIBRARY, APP_ARCHITECTURE), no perf gate |
| Content as product | 7 | accuracy 6.5, voice 8, coverage 6, trust 3.5 | Accuracy now high after Phases 19–20 and voice excellent; grammar, one template ×365, trust still hidden (about 3.5), coverage unchanged (6) |
| **Overall** | **8** | 7.5 | |

## 3. Priority list

Effort: S = under an hour, M = half a day, L = more.

### P1 — Next (the biggest wins)

1. **Always Use HTTPS (owner, Cloudflare dashboard, 1 min).**
   - `http://istorija365.com/` and `/api/me` answer 200 with the page.
   - Sign-in from http fails, because the `__Host-` cookie is refused.
   - Local progress on http is stored separately from https.
   - Cloudflare → SSL/TLS → Edge Certificates → *Always Use HTTPS*. Optionally add HSTS preload later.
2. **Bump Next to ≥ 15.5.24 and sharp to ≥ 0.35.4 (S).**
   - Add Dependabot, plus a non-blocking `pnpm audit --prod` step in CI.
   - `/_next/image` is live, so the image-optimizer advisories apply. Exploitability is judged low but was not proven.
3. **Fonts: back to the mobile floor (M).**
   - Preload only Spectral 400 and Inter latin; the rest load on use.
   - Subset to Serbian Latin.
   - Home's mobile LCP is the decorative hero background, a CSS background found only after the stylesheets load (about 2.2 s delay). Preload it, or drop it under 720 px.
   - Add a font-preload budget to `scripts/bundle-size.mjs` and a warn-only Lighthouse CI step, so this cannot regress silently again.
   - Target: mobile ≥ 82 on Home, overview and lesson.
4. **Signed-in sync: no silent loss (M).**
   - A per-user pending-changes queue in `localStorage`, recorded from store load, not from the sync subscription (`LessonShell.tsx:97/117` vs `CloudSync.tsx:34/158`, `syncEngine.ts:146,161`).
   - Replay it after an outage or offline close.
   - Add a `storage` listener so two tabs do not overwrite each other.
   - Make sign-out in one tab clear the other tab's in-memory store, so the previous user's progress cannot be written back without the sync marker.
5. **Progress tree tells the truth (S, one PR):**
   - `LessonNavItem` takes `active` and `completed` as two flags. Today `state` is single-valued and "active" wins (`LessonNavItem.tsx:10,25-26,46`), so the current row never shows as read and screen readers lose ", pročitano".
   - The course overview's progress card and the highlighted tree row point at the same lesson (today Dan 121 vs row 120).
   - Completion copy follows position, not count (`CompletedFooter.tsx:56,65,94`), and a real finish moment at 365 / 365.
   - **Owner picks the resume rule:** today "Tvoj N. dan" follows any lesson merely *opened* (Days 1–3 read and Day 250 opened gives "Tvoj 250. dan"). Recommended: resume follows the first unread after the last *read* lesson; "opened" only feeds "Nastavi gde si stao".
6. **Reader polish already announced in HANDOFF (S each, one PR):**
   - Paragraphs sit 60 px apart; add `.body > p { margin: 0 }`.
   - `Označi kao pročitano` is 194×42 px with 13 px text. Make it the primary action, full width on mobile.
   - About 450 px of header before reading on desktop, with the date shown twice.
   - After completing, three alignments stack (pill, centred line, card); use one column.
7. **Day 1 figure (S, asset).** The file is 1440×1080 in 28.6 kB, which is why it is blurry, on the lesson that sets the first impression. Re-export from the original at ≥ 1320 px wide, or pick a sharper Commons image.
8. **Proofreading pass + house style sheet (M, Claude can draft per era, the owner approves).**
   - About 30 slips in the 15-lesson sample: „svake pohode" (124), „mnoge tihe pomeranje" (194), „sa više glavnih boli" (224), „1878.Pravac" (248), „kolosjeke" (287), „uz prekide, ostala neprekinuta" (105)…
   - Settle Habzburšk- (39) / Habsburšk- (8) and Austro-Ugarsk- / Austrougarsk-.
   - Fix the wrong closing quote " in 16 lessons.
9. **A truthful trust layer (S–M, owner approves the wording).** No invented bylines.
   - A „Literatura i provera" page per era, built from `docs/review/`.
   - One line per lesson, e.g. „Činjenice proverene sept.–okt. 2026 · dva prolaza, AI uz urednika".
   - A „Prijavi grešku" mailto.
   - `lastReviewedAt` stays for a named human reviewer.

### P2 — Polish (bundle by theme)

10. **Mobile course overview (M).** The 92 px era-label column squeezes each description into about 230 px (7 lines). The page is 3709 px fresh and 4978 px with one era open. Stack the label above the card under 720 px.
11. **Focus and ARIA set (S):**
    - Focus `#lesson-reader` or the h1 after every lesson change (today it falls to `<body>`).
    - `Ne sada` moves focus to the completed wrapper.
    - `Otvori sadržaj` gets `aria-expanded`, `aria-controls` and `aria-haspopup="dialog"` (`LessonContextHeader.tsx:37-45`).
    - The bookmark's accessible name matches its visible label (WCAG 2.5.3).
    - The page behind the drawer is `inert`.
    - Section counters are read as „4 od 9 pročitano".
    - Era names on the Home rail and the course cards start with their visible label again (Phase 5 had this).
12. **Images and caching (S):** shrink the era-6 figure (570 kB), cap portrait figures (they render about 1000 px tall), give `/_next/image` a long `minimumCacheTTL`, and add a Cloudflare cache rule for it.
13. **Rate limit (owner, §13b, dashboard).** 35 rapid `GET /api/health` all answered 200; that route hits a 5-connection pool.
14. **SEO set (S/M):**
    - Per-era share cards (S); per-lesson cards later (M).
    - `og:type=article` on lessons.
    - Breadcrumb JSON-LD gives era and section their own URLs.
    - `dateModified` and sitemap `lastmod` come from git or a content field. Today lessons edited 09-30 and 10-01 show 2026-05-19.
    - The `og:url` on 404 and account pages.
15. **Serbian routes (M), while backlinks are few.** First add one `lessonHref()` helper to replace the 12 hand-built lesson URLs in 11 files. Then `/kurs/…/lekcija/dan-NNN` with 308 redirects.
16. **Doc drift (S):**
    - `COMPONENT_LIBRARY.md` and `APP_ARCHITECTURE.md` are out of date. They forbid the `ui-web → core` formatter imports that six components use, and still list `LessonEraStrip` and a component-test layer that does not exist.
    - Move five stale plans and reviews into `docs/archive/`.
    - Make one file the canonical content contract (today two claim it).
    - Update the `PROJECT_STATE` performance numbers.
17. **Content metadata (S):**
    - 305 summaries are over 160 characters (share previews cut them).
    - 26 `dateLabel`s are not dates ("pregled" ×13).
    - Decide render-or-drop for `keyPeople` (empty on 64 lessons), `keyPlaces` and `timelinePosition` (equal to `dateLabel` on 275).
    - 25 backwards `year` steps inside eras (down from 45).
18. **Seven incidental factual slips, to check (S):**
    - Day 008: the opening contradicts the next paragraph.
    - Day 108: Dušan „krunisao sebe".
    - Day 124: Belgrade „prvi put" capital, next to Dragutin's Srem.
    - Day 224: „nekoliko desetina ljudi" against a 17-member council.
    - Day 240: Fetislam „kod Negotina", „sredinom šezdesetih" for 1862, Garašanin „kancelar".
    - Day 248: mixed Julian / Gregorian dates.
    - Day 354: „najpre Rusija" for the first recognitions.
19. **Balance soft spots (owner, S):**
    - Day 287: the 1912–13 violence framed in one clause as „odmazdi za stvarne ili pripisane otpore".
    - Day 194: a destiny-style ending about unification.
    - Day 162: only the Serbian view on the Vlachs.
    - Day 240: the killing of a boy called „Sitan, gotovo svakodnevni nesporazum".
20. **Off-box backup must prune (S, only if it is ever switched on).** As designed it never deletes anything at the destination, while `/privatnost` promises at most 14 days.

### P3 — Later / owner

21. **Coverage by swapping, not adding (L, editorial).**
    - No mention of Tesla, Pupin or Milanković.
    - No lesson of their own for Vuk Karadžić, Srpska Vojvodina 1848, Njegoš and 19th-century Montenegro, Nevesinje 1875 or Gazimestan.
    - No women's lessons after 1400.
    - The 9th–12th centuries get 2 lessons, while Era I gets 45.
    - Freeable slots: Day 105 overlaps 148–149, and 194/195 cover the same three centuries back to back.
22. **One template ×365 (M, editorial).**
    - 363 lessons have exactly one H2, and the whole corpus has 1 quote.
    - 109 lessons open with "Kada…", and „pošten-" appears in 134.
    - „ovde je dovoljno reći da" repeats in 10 lessons.
    - Day 282's „ono što istoričar mora reći" clashes with the AI disclosure on About.
23. **CI/CD supply chain (S):**
    - Pin actions by SHA, and add `permissions:` to `ci.yml`.
    - Stop re-pushing `:latest` on a re-run.
    - `deploy.sh` should write the new tag only after a successful pull, under an error trap.
24. **Session hygiene (S):** end the previous browser session on re-login, add an absolute session lifetime, "sign out everywhere", and mention the Google access grant on account deletion.
25. **Shell details (S):**
    - Eras in the outline never close again (`LessonShell.tsx:112-114`).
    - Closing the drawer by resize focuses a hidden button.
    - Phones get two skip links in a row.
    - The TopBar live region speaks on page load.
    - Breadcrumb era and section links open a lesson.
    - The desktop hero's empty right half and the uneven Home era bands (both from the Phase 18 walk) still stand.

### Owner steps on the box, re-checked 2026-10-01 (read-only)

- **Deploy key:** `authorized_keys` still starts `no-port-forwarding,…`, with no `restrict,command=…`. A leaked laptop key is still a full shell for `deploy`, who runs Docker on the box Računi shares. This is the highest-impact open ops item; see DEPLOY §13a.
- **Box scripts:** `/srv/learn365/deploy.sh` and `backup.sh` still differ from the repo; see §9 "Ops set".
- **`.env`:** mode `600 deploy` is done.
- **Hetzner Backups:** on. A restore test has never been done.
- **Declined by the owner (2026-10-01):** rotating the Google client secret (residual risk low: PKCE plus the registered redirect URI) and naming the data controller on `/privatnost`.

## 4. What is right and must be protected

- **The calm, non-hagiographic voice** and the multiple perspectives (e.g. Days 49, 162, 214, 248, 282, 354), and honest ranges instead of fake precision. A proofreading or de-tic pass changes formulas only, never this stance.
- **Even lessons:** median 850 words, 364 of 365 within 5–7 min, no copy-paste across lessons.
- **The persistent shell:** a server-rendered reader with client islands, CLS 0 everywhere, the returning-reader pre-paint, and the drawer's focus trap, Escape and focus return.
- **Code discipline:** strict types, explicit promise handling, 300 tests, a 2-minute CI, deploys that roll back on their own, and the CSRF Origin checks (live probes 403).
- **The palette and type system,** the resume loop and the brand consistency.
- **The review trail in `docs/review/`.** It is the raw material for the trust layer.

## 5. Measurements

| Route | Mobile LH | Mobile LCP | Desktop LH | Desktop LCP |
|---|---|---|---|---|
| Home | 61 / 65 / 69 | 5.0–5.8 s | 95–96 | 1.2–1.4 s |
| Course overview | 70 / 78 | 4.8–5.2 s | 90–97 | 1.2–1.8 s |
| Lesson day-001 | 73 / 83 | 3.7–5.3 s | 98–99 | 0.8–1.1 s |
| Lesson day-150 | 72 / 73 | 4.9–5.1 s | 94–97 | 1.25–1.6 s |

- Lighthouse Accessibility, Best Practices and SEO score 100 on every run. CLS is 0.000 everywhere. Mobile TBT is 147–555 ms.
- **Fonts:** 12–13 requests and 277–308 kB per page, more than all the JS (about 170 kB). With fonts blocked, Home scores 80–81 and a lesson 82–85.
- Unthrottled real loads have LCP 0.47–1.17 s; the problem is mid-range phones on mobile data.
- **Local gates:** typecheck, lint, Vitest 300 / 300 and validate-content pass. CI takes 1.6–2.8 min and a deploy 0.8–2.6 min.
- **Corpus:** median 850 words (646–1055), reading time 5 min ×21, 6 ×271, 7 ×72, 8 ×1 (Day 247), and 8 images. `sources` 6, `byline` 0, `lastReviewedAt` 6 (all 2026-05-19).

## 6. Method

- Each pass wrote a scored report with severity, effort, evidence and a fix, and was told not to re-report fixed items unless they had regressed.
- The content pass did not repeat fact-checking (Phases 19–20). It reported incidental slips separately and did not research them.
- No pass ssh'd anywhere or changed the repo. The merger's box checks were read-only (`diff`, `grep`, `stat`).
- Suggested order: P1 1–2 today (the owner's minute plus one S PR), then 5 + 6 + 11 as one UX PR, then 3, then 4, then the content items as the owner chooses.
