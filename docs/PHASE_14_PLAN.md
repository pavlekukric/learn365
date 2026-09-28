# Phase 14 — P2 polish bundle A: one vocabulary, one day label, a11y, secondary chrome, security headers, code hygiene, docs drift (PLAN)

**Status:** Built under the standing authorization of 2026-09-28 (plan, build, PR, merge on green CI; HANDOFF after the unit).
**Date:** 2026-09-28
**Predecessors:** Phase 13 live (PR #48, `85ebe41`); Phase 12 box rollout done (D6).
**Parent references:**
- [`docs/PRODUCT_REVIEW_2026-09-28.md`](./PRODUCT_REVIEW_2026-09-28.md) — P2 items **13, 14, 15, 18, 20, 21, 22**. Items **16 + 17** (mobile reader stack, desktop reader frame) change the reader layout the owner declared a floor and are planned separately as Phase 15; item **19** (brand / About tone) is the owner's.
- [`HANDOFF.md`](../HANDOFF.md) — "Next pick: the P2 polish bundle".

## Why this bundle, why this split

Every item here is small, mechanical and verifiable by the existing gates; none changes what a page *is*. The two reader-layout items are the opposite (a persistent layout shell, a moved sign-in ask, a hidden timeline), so they get their own plan and their own screenshot review instead of hiding inside a hygiene PR.

---

## 1. Locked decisions

### D1 — One vocabulary (item 13)

- **Completion family = *pročitano*.** `MarkAsCompletedButton` reads `Označi kao pročitano` and, pressed, `Pročitano` (the word every counter, the era card and the mobile header already use). The how-it-works step 2 title becomes the button's text verbatim: `Označi kao pročitano`. `Završi` / `Završeno` leave the product.
- **Start family = *počni*.** Home hero `Započni kurs` → `Počni kurs`; the course card kicker `Započni · DAN 001` → `Počni · DAN 001`; `Počni od Dana 1` and the era cards' `Počni` stay. `Nastavi …` is already one family.
- **Gender-neutral second person.** Serbian past tense is gendered, so the copy avoids it: `Završio si poslednju lekciju ovog dela kursa.` → `Poslednja lekcija kursa je iza tebe.` (the Day 365 message no longer says "ovog dela kursa"); `Ono što si ovde pročitao prenosi se na nalog.` → `Pročitane lekcije prenose se na nalog.`; `Nastavi tamo gde si stao.` → `Sledeća lekcija te čeka.`; how-it-works step 3 `Sutra nastavi gde si stao` → `Sutra nastavi dalje`; 404 `nastavi odakle si stao` → `nastavi dalje`.
- Tests, the screenshot spec and the screenshots README follow the new strings.

### D2 — One day formatter (item 14)

`@learn365/core` gains `format/day.ts` with these registers and no others:

| Helper | Output | Where |
| --- | --- | --- |
| `padDay(1)` | `001` | sidebar rows; the mobile context header (`Dan 001 / 365`, unchanged until Phase 15) |
| `formatDayEyebrow(1)` | `DAN 001` | every mono eyebrow: lesson cards, prev/next, completed footer, bookmarks, course card |
| `formatDayProse(1)` | `Dan 1` | sentences and metadata: `Dan 1: <title>`, `Dan 1 je iza tebe.` |
| `formatDayRange(1, 5)` | `DAN 001–005` | section rows (sidebar accordion and the course overview) |
| `formatJourneyDay(2)` | `Tvoj 2. dan` | the daily anchor and the course card eyebrow |

`D001` is retired everywhere (sidebar rows show the bare numeral under their section's `DAN 001–005`). The ten local `formatDay` copies go.

**One story for "Tvoj N. dan".** Today the anchor says `Tvoj 3. dan` (completed + 1) above a card that says `DAN 002` (the resume lesson) whenever the reader has skipped around. From now on **N is the day of the lesson the reader is about to open** — `useResumeLesson` returns `journeyDay` (the resume lesson's `dayNumber`; `totalLessons` once everything is read; `null` before the first completion) and both `HomeDailyAnchor` and `CourseOverviewProgress` render `formatJourneyDay(journeyDay)`. The hardcoded `TOTAL_DAYS = 365` goes. For a reader who never skips nothing changes (Day 1 done → `Tvoj 2. dan` above `DAN 002`).

### D3 — Contrast, language, ARIA (item 15)

- `--faint` (≈ 2.6 : 1) is no longer a text colour: sidebar row minutes, era years in the sidebar, the rail's years, the disabled prev/next labels and placeholder rows move to `--muted` (≈ 5.5 : 1). `--faint` stays for the two decorative separators (`/` in breadcrumbs, `·` in the footer), which are `aria-hidden`.
- `<html lang="sr-Latn">`.
- The TopBar capsule and the mobile header's count become `role="status"` (the `aria-label` stays as the region's name; the count is announced when it changes, which is the feedback a completion deserves).
- `Breadcrumbs` no longer marks the last crumb `aria-current="page"` when it links somewhere: a crumb with an `href` is a link wherever it sits; `aria-current="page"` only on a last crumb without one. On the lesson page all four crumbs are links to ancestors and none claims to be the page.
- `CourseCard`'s disclosure button drops its `aria-label` for `aria-labelledby` = the visible number + title (`EPOHA I Praistorija i antika`), so the accessible name is what is on screen. The era action link keeps its label (`Počni: <era>`) — its visible text is the verb alone.

### D4 — Secondary-route chrome (item 18)

- `TopBarRoute` gains `'other'`; `/privatnost`, `/prijava`, `/nalog` and the 404 resolve to it and light no nav item.
- `/nalog`: `Odjava` becomes an outlined pill (not the page's filled primary — there is none; the page is information plus two account actions), `Obriši nalog` stays the quiet text action, and a `Nazad na čitanje` link (as on `/prijava`) closes the card.
- TopBar at 360 px with `365 / 365`: **measured in Chromium** after the build (masthead `scrollWidth` vs the viewport, every child inside the shell). If it overflows, the smallest fix that keeps the label wins (tighter gaps first; the denominator ≤ 400 px only if gaps are not enough). The measurement and the choice are recorded in PROJECT_STATE.

### D5 — Security headers and limits (item 20)

- `next.config.mjs`: `poweredByHeader: false` and a `headers()` block for every route: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production build only), and a **Content-Security-Policy**: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googleusercontent.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` (+ `'unsafe-eval'` in `script-src` for `next dev` only). No nonce: a nonce needs dynamic rendering, which would undo the 373 prerendered pages (Phase 9); `'unsafe-inline'` for scripts is what a static Next app can promise, and it still blocks every foreign origin. Fonts are self-served by `next/font` (`/_next/static/media`); the only foreign image is the Google profile picture. The Playwright suite runs against `next start`, so a CSP that broke hydration would fail CI.
- **`__Host-` session cookie.** `sessionCookieName(secure)` = `__Host-l365_session` on https, `l365_session` otherwise (the prefix requires `Secure`, which local http cannot set). Readers try the prefixed name first and fall back to the legacy name for one release; writers set only the prefixed one; sign-out and expiry clear both. Nobody is signed out by the change. The ten-minute OAuth state cookie gets the same prefix rule.
- **Deploy key forced command** (owner action — the box is not written from here): `deploy/ssh-command.sh` accepts exactly `bash /srv/learn365/deploy.sh sha-<12 hex>` from `SSH_ORIGINAL_COMMAND` and refuses anything else; `vps-install.sh` writes `command="/srv/learn365/ssh-command.sh",no-port-forwarding,…` for fresh installs; DEPLOY §9 carries the one-line edit for the existing box. A leaked `DEPLOY_SSH_KEY` can then only redeploy this app.
- **Cloudflare rate limits** on `/api/auth/*` and `/api/me/*` — owner action in the dashboard; DEPLOY §13 records the two rules to create (values, not screenshots).

### D6 — Code hygiene (item 21)

- **`Button` is the pill.** The primitive becomes the one ink pill (`variant: 'primary' | 'outline' | 'quiet'`; `href` renders `next/link`, otherwise `<button>`; optional `iconRight`), and the five CSS copies go: Home hero CTA, the 404 page, the account pages (`.primary`, `.danger`), `CourseProgress.startCta`, `SignInPrompt.primary`. Same pixels (12 × 22 px, 14 px sans 500, `--r-pill`, ink on cream, 1 px lift on hover).
- **Dead exports.** `Card`, `Chip`, `Placeholder` are rendered nowhere (grep) and are deleted with their stylesheets; `COMPONENT_LIBRARY.md` follows. (`JumpToDay` was already gone.)
- **One `readJsonRecord()`** in `lib/server/http.ts` replaces the four copies of the try / catch / `asRecord` / null dance in the `/api/me/**` PATCH and POST handlers.
- **Lint that sees hooks and a11y.** `apps/web/eslint.config.mjs` spreads the flat configs of `@next/eslint-plugin-next` (core-web-vitals), `eslint-plugin-react-hooks` (`recommended-latest`) and `eslint-plugin-jsx-a11y` (recommended), declared directly in `devDependencies` (they are what `eslint-config-next` installs; its own export is eslintrc-only, so it goes). `e2e/**` and the Playwright configs are linted and type-checked (`tsc -p tsconfig.e2e.json` joins `typecheck`).
- `turbo.json`: `dev` depends on `^build` (a fresh clone's `pnpm dev` no longer needs a manual `@learn365/ui` build).
- **Not done here:** "keep the article a server component and island only the completion footer" is the reader's shell — Phase 15. Spectral italic 300 is unused but italic 500 is the brand monogram; per-style weights are impossible with `next/font/google`, so the trim rides with the self-hosted-fonts follow-up (which also ends the CI fetch flake).

### D7 — Docs drift (item 22)

- `CONTENT_MODEL.md` and `CONTENT_AUTHORING.md` describe the contract that exists: JSON under `content/courses/istorija-srbije-365/`, `Course → Era → Section → Lesson` with `eraId` + `sectionId`, ids `istorija-srbije-365` / `day-001`, the block union, derived reading time, `pnpm gen-content` + the CI drift check, no stubs (365 authored; `isPlaceholder` remains as a field).
- `README.md`: the reading-time promise and the exclusions match Phases 8 + 11; `BACKEND_STRATEGY.md`: no `arctic`, one `CloudSync`; `screenshots/README.md` + `capture.spec.ts`: the placeholder shot is gone, the strings follow D1.
- `PROJECT_STATE.md`: the baseline header date, the duplicated "Last shipped phase" bullets, the "unmerged" markers on shipped Phase 8 / P0 work and the four `.NET 9 + SQL Server` lines are corrected. The phase log stays where it is: every plan and HANDOFF entry links into it by heading, and moving 1 300 lines to `archive/` for a smaller file would break those links for no reader.

### D8 — One PR, five commits

- **14a — Vocabulary + day labels** (D1, D2): core `format/day.ts` + tests, the copy edits, `useResumeLesson.journeyDay`, e2e strings.
- **14b — A11y + secondary chrome** (D3, D4): CSS colours, `lang`, `role="status"`, `Breadcrumbs`, `CourseCard`, `TopBarRoute 'other'`, `/nalog` actions, the 360 px measurement.
- **14c — Security** (D5): headers, cookie names, `deploy/ssh-command.sh`, DEPLOY §9 / §13.
- **14d — Hygiene** (D6): `Button`, dead primitives, `readJsonRecord`, lint + e2e typecheck, turbo.
- **14e — Docs** (D7): content docs, README, backend strategy, screenshots, PROJECT_STATE, HANDOFF, plan archived.

## 2. Gates

`pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm --filter @learn365/web check-bundle`; Playwright Chromium desktop + mobile locally and in CI; after the rollout a `curl -I` of the production Home shows the six headers, `/api/health` is ok, and a browser signed in before the rollout is still signed in after it (the legacy cookie is honoured).

## 3. Owner actions (none blocking)

1. Deploy key forced command on the box (DEPLOY §9, one edit of `authorized_keys`).
2. Two Cloudflare rate-limit rules (DEPLOY §13).
3. Rotate the Google client secret (still open from P0 item 1).

## 4. Out of scope

Reader layout (items 16, 17 → Phase 15), brand / About tone (19), the P3 editorial items, self-hosted fonts, moving the phase log.
