# Phase 7.1 — Trust polish (PLAN)

**Status:** Draft, awaiting owner green-light to lock decisions and implement.
**Date:** 2026-05-17
**Predecessors:** Phase 7.0a–e shipped (premium clarity declutter). Phase 7.0d
removed the disabled `O aplikaciji` span from `TopBar`; this phase restores it
as a real link to a real page.
**Parent references:**
- [`docs/NEXT_PHASE_RECOMMENDATION.md`](./NEXT_PHASE_RECOMMENDATION.md) §2 Pick 1
- [`docs/PHASE_7_0_PLAN.md`](./PHASE_7_0_PLAN.md) §6 "Phase 7.1 — Trust polish"
- [`docs/UX_AUDIT_CURRENT_UI.md`](./UX_AUDIT_CURRENT_UI.md) §3.1 + §6.5

## Why this is the next phase

The single biggest "is this a real product?" signal a first-time visitor
clocks is the absence of any footer or about page. Every other surface
(home, course, lesson) is at premium quality after Phases 6.8 / 6.9 / 7.0,
but a visitor who scrolls past the home eras strip lands on dead whitespace,
and there is nowhere to learn who made the thing or what its editorial
standard is. Highest trust-per-line-of-code in the backlog. Low risk: new
surfaces, no removal of existing behaviour. The footer is the only
cross-route change.

---

## 1. Open decisions for the owner

Locking these before implementation. Each has a recommendation; flip any
freely.

### D1 — `/o-aplikaciji` content depth

**Recommendation:** **short editorial about page**, not a marketing landing
page. ~5 sections, ~400–600 words total in Serbian. Reads in under two
minutes. Holds the editorial register of the lesson reader.

Proposed sections (working titles):
1. **Misija** — one paragraph. Why a 365-day course in Serbian history exists.
2. **Urednički standard** — one paragraph. The historiographical posture:
   based on academic sources, written for general readers, ~8 min per day.
3. **O izvorima** — one paragraph. Where the material comes from in general
   terms (academic histories, primary sources where relevant). Not a
   bibliography — that lives per-lesson in a future phase if at all.
4. **Urednik / Autor** — one short paragraph or "Tim" line. Honest about
   who's behind it. Single name, short bio, or "u izradi" placeholder copy
   if not yet decided — see D4.
5. **Kontakt** — one line. Email address (mailto link). No form.

**Alternative:** longer marketing-style page with imagery, testimonials,
"Why Learn?" sections. **Rejected** unless owner overrides — would clash
with the editorial register established by the lesson reader.

### D2 — Footer scope

**Recommendation:** **minimal editorial footer, four lines, one row on
desktop and stacked on mobile.** Content:
- Brand mark (the existing `<Brand />`)
- Editorial note: `Premium dnevni vodič kroz istoriju Srbije.` (or
  equivalent — owner copy)
- Link row: `O aplikaciji` · `Izvori` (link to `/o-aplikaciji#izvori`)
- Copyright line: `© 2026 History 365`

**Visual register:** hairline top border (`var(--rule)`), parchment
background, `--ink-2` body type, `--muted` for the copyright. No CTA, no
newsletter signup, no social icons. Sticky? **No** — page-end footer only.

**Alternative:** larger 3-column footer (sitemap / about / contact).
**Rejected** — out of register with the editorial direction, and the only
linkable destinations in v1 are `/`, the single course page, and
`/o-aplikaciji`. Three columns of the same three links would read empty.

### D3 — TopBar `O aplikaciji` link placement

**Recommendation:** restore the link in the same slot it occupied before
Phase 7.0d removed it — **between `Kurs` and the progress capsule**, as a
real `<Link href="/o-aplikaciji">`. Active state matches the existing
`Početna` / `Kurs` treatment (`.active` class, `aria-current="page"`).

**Mobile:** the existing `@media (max-width: 720px)` rule in
`TopBar.module.css` hides all `.nav a` links on mobile so the header
reduces to brand + progress capsule. **Keep that behaviour** — the new
`O aplikaciji` link inherits the hide, the footer is what surfaces the
page on mobile.

**Alternative:** put it after the progress capsule. **Rejected** — would
visually orphan the progress capsule mid-row.

### D4 — Author / editor attribution

**Question for the owner:** is there a real name to attach to the `Urednik`
section, or does the page ship with a placeholder?

Options:
- (a) **Real name + one-paragraph bio.** Best for trust.
- (b) **"Tim History 365" generic byline.** Honest if there is no single
  named editor.
- (c) **Placeholder copy** like "Urednik će biti objavljen sa završetkom
  prve epohe." Acceptable but weaker than (a) or (b).

**Recommendation: (a) if available, (b) otherwise.** Do not ship (c)
unless owner explicitly prefers it.

### D5 — Sources page vs. inline section

**Recommendation:** **inline section inside `/o-aplikaciji`** (the
`O izvorima` paragraph above), with a `#izvori` anchor so the footer
"Izvori" link can deep-link to it. A separate `/izvori` route is overkill
for one paragraph of v1 copy.

**Revisit:** when the editorial team starts attaching per-lesson sources
(post-launch), `/izvori` can graduate into its own route. Out of scope
here.

---

## 2. Scope reframe — what trust polish is, and what it is not

**Trust polish = the page and chrome a first-time visitor needs to confirm
this is a real, edited product before they invest the time to start Day 1.**

Held as durable truth for this phase:

- The lesson reader is the visual benchmark. The about page and footer must
  match its register (Spectral display, parchment ground, hairline rules,
  drop-cap-quality prose). They are **not** marketing surfaces.
- No new components on the home, course, or lesson screens. The visible
  change there is one new TopBar link and one new footer at the bottom of
  the route.
- No backend, no form submission, no newsletter, no auth, no analytics
  beacons. `mailto:` is the only outbound action.
- No imagery beyond what the editorial system already supports
  (`Flourish`, existing tokens). Avoid stock photography; commission-grade
  imagery is out of scope.

---

## 3. What this phase is NOT addressing

- **Home hero v2.** The home hero + eras rail are visually thin (see
  recommendation doc §2 Pick 2). Separate phase.
- **Phase 7.2 — Section in breadcrumb.** Separate phase.
- **Per-lesson sources / citations.** Editorial workflow concern, not a
  trust-polish UI concern. The about-page `O izvorima` paragraph is the
  v1 surface for the question "are these lessons sourced".
- **`/privatnost`, `/uslovi`, `/kolacici`.** No tracking, no accounts, no
  cookies beyond the existing local Zustand persistence — legal pages are
  not load-bearing in v1. Revisit when a backend or analytics ships.
- **Locale switcher / English page.** V1 is Serbian only.
- **404 / error page polish.** Real concern but separate; pick up after the
  about page sets the editorial bar for non-content routes.

---

## 4. Phase 7.1 bundle

Three sub-bundles, ordered by surface. Per the cadence pattern established in
7.0, all three ship inside **one PR** as separate commits — one screenshot
review at the end covers the whole pass. Commit boundaries kept so any single
piece can be reverted in isolation.

### 7.1a — `Footer` primitive + mount in root layout

**Goal:** Every route ends with a calm, editorial footer landmark. The
footer is the only cross-route change in this phase.

**New files (≈3):**
- `packages/ui-web/src/primitives/Footer/Footer.tsx` — stateless component.
  Props: `aboutHref: string`, `sourcesHref: string` (typically
  `${aboutHref}#izvori`). Renders `<footer role="contentinfo">` with
  `<Brand />`, the editorial tagline, the link row, the copyright line. No
  hooks, no client directive.
- `packages/ui-web/src/primitives/Footer/Footer.module.css` — hairline top
  border, parchment background (`var(--bg)` so it blends), `shell` for
  inner max-width. Desktop: one row, four logical groups, space-between.
  Mobile (≤720px): stacked, left-aligned, tightened gaps.
- `packages/ui-web/src/primitives/index.ts` — export `Footer`.

**Files modified (2):**
- `apps/web/app/layout.tsx` — render `<Footer aboutHref="/o-aplikaciji"
  sourcesHref="/o-aplikaciji#izvori" />` after the `<main>` block, inside
  `<AppProviders>` so it shares the same provider scope (no provider state
  is read by the footer today, but the bracketing keeps DOM order
  predictable).
- `apps/web/app/globals.css` — if `<main>` currently relies on
  flex/auto-margin to keep the footer at viewport bottom on short pages, add
  the minimal rule needed. Likely a `min-height: calc(100dvh - …)` on the
  body or a `display: flex; flex-direction: column` on `body` with `main`
  growing. Decided at implementation time after reading the current
  globals.css.

**Unchanged:** the TopBar (handled in 7.1c), every page component, every
existing primitive.

**Why it's safe:** Additive only. The footer is a new landmark; no existing
DOM changes. The single risk is layout shift on short pages — caught at
screenshot review.

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Screenshots: home, course, lesson Day 1, lesson Day 7 (completed
  moment), lesson placeholder — desktop 1440 + mobile 375. Footer
  consistent across all five routes, no horizontal scroll, hairline rule
  reads as deliberate.
- A11y spot-check: the new `<footer>` should be announced as a
  `contentinfo` landmark by screen readers (NVDA / VoiceOver).

### 7.1b — `/o-aplikaciji` route

**Goal:** A new editorial page that reads like an essay, not a sales
landing. Holds the `#izvori` anchor that the footer links to.

**New files (≈3):**
- `apps/web/app/o-aplikaciji/page.tsx` — Server Component. Renders the
  five-section page per D1. Uses existing primitives where appropriate
  (`Eyebrow`, `Flourish`, in-page `<h1>` / `<h2>` / `<p>` with the
  editorial CSS classes from `globals.css`). Includes
  `<section id="izvori">` for the deep-link target. Page-level metadata
  (`export const metadata`) sets the title (`O aplikaciji`) and
  description.
- `apps/web/app/o-aplikaciji/page.module.css` — page-scoped layout:
  `shell` max-width, generous top padding to clear the sticky TopBar,
  measured rhythm between sections (`var(--space-8)` between section
  blocks, `var(--space-3)` inside).
- `apps/web/app/o-aplikaciji/_copy.ts` — copy constants in Serbian
  (`MISSION`, `STANDARD`, `SOURCES`, `EDITOR`, `CONTACT`). Single source
  of truth so the owner can iterate copy without touching JSX. Pending
  D4: `EDITOR` shipped as the chosen variant.

**Unchanged:** all other routes; the TopBar (handled in 7.1c).

**Verification:**
- typecheck + lint + test + build.
- Manual: `/o-aplikaciji` renders, anchor `#izvori` scrolls to the right
  section, `mailto:` link opens the user's mail client, the page is
  responsive at 360 / 768 / 1280 / 1920.
- Title appears as `O aplikaciji · History 365` per the
  `template: '%s · History 365'` in `apps/web/app/layout.tsx`.

### 7.1c — TopBar restoration + route detection

**Goal:** The `O aplikaciji` link returns to the TopBar as a real `<Link>`
and lights up `aria-current="page"` on the about route.

**Files modified (≈3):**
- `packages/ui-web/src/primitives/TopBar/TopBar.tsx` — add a third nav
  `<Link href={aboutHref} …>` between `Kurs` and the `.progressGroup`. Add
  `aboutHref: string` to `TopBarProps`. The existing `TopBarRoute` already
  includes `'about'` (added in 7.0 prep); use it for the `aria-current`
  branch. Label: `O aplikaciji`.
- `apps/web/components/top-bar/TopBarHost.tsx` — update `routeFromPath` to
  return `'about'` for paths starting with `/o-aplikaciji`. Thread the new
  `aboutHref="/o-aplikaciji"` prop. (Today the only known about URL is
  the literal path; if Phase 8 introduces locale routing this gets
  parameterised then, not now.)
- `apps/web/e2e/smoke.spec.ts` — add assertion: visit `/o-aplikaciji`,
  check the page heading is present, check the footer's about link is
  reachable. If existing TopBar assertions check link count, update the
  expected count to 3.

**Unchanged:** TopBar.module.css beyond what's needed for the new link
slot (the existing `.nav a` rules apply uniformly; no new class needed if
the existing styling pattern is reused). Verify at implementation time
whether the mobile `display: none` rule should still hide the new link —
per D3, **yes**, no change needed.

**Verification:**
- typecheck + lint + test + build.
- `pnpm test:e2e` — Playwright run with the new assertion plus regression
  on the home / course / lesson smoke.
- Screenshots: TopBar with `O aplikaciji` highlighted while on
  `/o-aplikaciji`, and unhighlighted on `/`, course, lesson. Desktop +
  mobile (where the link is hidden by the 720px rule).

---

## 5. Engineering gates per sub-bundle

Each commit (7.1a → 7.1b → 7.1c) passes locally before the next is layered
on top. Final PR gates run against the full bundle:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (Vitest — no new unit tests planned; Footer is pure markup,
  about page is pure markup, TopBar change is one new prop)
- `pnpm build`
- `pnpm validate-content` (no content changes; sanity check only)
- `pnpm test:e2e` (Playwright — 7.1c adds the about-route assertion)

---

## 6. How to proceed

1. **Owner answers the five D-questions in §1** so the plan locks. The only
   one that blocks implementation is **D4 (author attribution)** because it
   determines `EDITOR` copy. D1–D3 + D5 have recommendations the owner can
   ratify with a single yes.
2. **I open `feat/phase-7-1-trust-polish` off `main`** and layer three
   commits: 7.1a → 7.1b → 7.1c. Each commit passes the engineering gates
   before the next is added.
3. **I push and open a draft PR** so the Vercel preview deploy generates a
   live URL.
4. **Owner previews the live site** (home, course, lesson, the new
   `/o-aplikaciji`, plus the footer on every route — desktop + mobile) and
   either approves or calls out anything that doesn't read right. If a
   single sub-bundle misses, that commit reverts cleanly; the others stay.
5. **On approval the PR merges**, `PROJECT_STATE.md` is updated with a
   `Phase 7.1 — Trust polish: done` section, and the phase is closed.
6. **Next-phase candidate after 7.1:** Home hero v2 (recommendation doc §2
   Pick 2). Open question deferred until 7.1 ships.

---

## 7. Out-of-scope reminders

This plan deliberately does **not** touch:

- Editorial color / type / motion tokens — calibrated, working.
- The home, course, or lesson page bodies. Only the chrome (TopBar + new
  Footer) changes on those routes.
- The MobileLessonDrawer — unchanged.
- The HistoricalTimeline — unchanged.
- Authored lesson content — separate workflow.
- Anything in `apps/api` or backend — Phase 8 territory.
- Legal pages (privacy / terms / cookies) — not load-bearing in v1.
- Locale switching — Serbian only in v1.
