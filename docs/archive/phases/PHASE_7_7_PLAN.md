# Phase 7.7 — Mobile global nav restoration (PLAN)

**Status:** Draft, awaiting owner green-light to implement.
**Date:** 2026-05-19
**Predecessors:** Phase 7.4 — Eras as editorial blocks shipped
(merged 2026-05-19, PR #16, commit `f6a849f`). New visual baseline declared
in `docs/PROJECT_STATE.md` § Current Baseline.
**Parent references:**

- [`docs/ROADMAP_PRE_PHASE_8.md`](../ROADMAP_PRE_PHASE_8.md) — Phase 7.7 entry
  (Bundle A). Locked R1: this bundle ships first.
- Independent mobile UI/UX assessment, 2026-05-19, §4 issue #1.
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — Current Baseline:
  "Mobile: responsive web only (no native app yet)" and the TopBar
  description naming the three nav links + progress capsule.
- [`HANDOFF.md`](../HANDOFF.md) — Pre-Phase-8 backlog.

## Why this is the next phase

A live audit of the post-7.4 mobile build (screenshot pack regenerated
2026-05-19, `screenshots/mobile/*`) confirmed that **the TopBar drops every
text nav link at ≤720px** —
[`packages/ui-web/src/primitives/TopBar/TopBar.module.css:108`](../packages/ui-web/src/primitives/TopBar/TopBar.module.css#L108):

```css
@media (max-width: 720px) {
  ...
  .nav a {
    display: none;
  }
  ...
}
```

with the comment:

> Mobile: drop the "Početna" / "Kurs" text links — both routes are
> reachable via the brand mark (Home) and the in-page breadcrumbs /
> lesson context header (Course). Keeps the header to brand + progress
> so it reads as editorial chrome rather than a web nav bar.

The comment is partly true: Brand reaches Home, and from the lesson page
the in-page breadcrumbs do carry Course. But **from the Home page on
mobile there is no in-page or in-chrome path to the Course overview at
all** — `apps/web/app/page.tsx` renders a "Započni kurs / Nastavi lekciju"
CTA that jumps straight to the lesson reader, not the course overview.
The home era timeline below it bands link to era-first lessons, not to
`/course/...`. The footer carries "O aplikaciji" and "Izvori" but not
"Kurs."

Result: a mobile user on Home cannot reach `/course/istorija-srbije-365`
from any persistent surface. This is a navigation bug, not a polish item,
and per the roadmap R1 lock it ships first.

Low blast radius: one CSS rule change, one prop unchanged, one Playwright
assertion added. Half-day of work.

---

## 1. Locked decisions

Confirmed with the owner on 2026-05-19 during roadmap sign-off.

### D1 — Keep "Kurs" text link in TopBar on mobile; drop "Početna" and "O aplikaciji"

Of three considered shapes the owner picked the minimal change:

- (a) **Chosen.** Keep `Kurs` visible on ≤720px. `Početna` stays hidden
  because the Brand mark already navigates to Home. `O aplikaciji` stays
  hidden because the footer carries it on every route.
- (b) Bottom tab bar — rejected as a second persistent UI surface that
  would compete with the lesson chrome and push the footer further down.
- (c) Both `Početna` + `Kurs` visible — rejected as redundant (Brand is
  the Home affordance) and tighter on 360px.

The mobile TopBar after this phase reads as: `Brand · Kurs · ProgressCapsule`.

**Why this preserves identity.** The editorial-chrome rationale in the
existing CSS comment was about avoiding a "web nav bar." One text link
between Brand and the progress capsule does not flip the register — it
matches how museum sites and editorial publications carry a single
section affordance in the masthead.

**Why the active state still reads.** The TopBar already uses
`route === 'lesson' || route === 'course'` to mark the Kurs link active
([`TopBar.tsx:29`](../packages/ui-web/src/primitives/TopBar/TopBar.tsx#L29)).
That logic is unchanged. On a lesson route, "Kurs" will read as the
active section on mobile, which is correct.

### D2 — No new components, no new routes, no hamburger

The fix is one CSS rule change plus one Playwright assertion. No new
React component, no menu drawer, no icon-only mode for the Kurs link.
The `O aplikaciji` link stays hidden on mobile per (a); accessibility is
preserved by the footer's `O aplikaciji` link (visible on every route via
`apps/web/app/layout.tsx` mounting `<Footer aboutHref="/o-aplikaciji" ... />`).

### D3 — One PR, single commit

This is small enough to ship as a single commit, not a sub-bundle chain.
A separate revert is a clean CSS-rule revert. No need for the 7.0a–7.4c
multi-commit pattern.

---

## 2. Scope reframe — what 7.7 is, and what it is not

**Phase 7.7 = the `Kurs` text link in the TopBar is visible on mobile, and
Playwright proves it.**

Held as durable truth for this phase:

- The CSS rule at `TopBar.module.css:108` is loosened from "hide all nav
  links" to "hide `Početna` and `O aplikaciji` only".
- No prop changes on `TopBar`. The existing `route` / `courseHref` /
  `aboutHref` props all stay.
- The active-state logic in `TopBar.tsx` is unchanged.
- Progress capsule mobile rules at 720 / 460 are unchanged.
- Footer behavior is unchanged.
- No new test target. One new assertion added to the existing
  `apps/web/e2e/smoke.spec.ts` suite.

---

## 3. What this phase is NOT addressing

- **A bottom tab bar.** Rejected in D1; reconsider only if mobile growth
  metrics ever signal it.
- **A mobile hamburger menu.** Out of scope; no menu drawer exists.
- **A mobile-reachable "O aplikaciji" link in the chrome.** Footer
  already carries it. Adding it to mobile TopBar would tighten the
  header beyond comfort at 360px.
- **The Brand mark behavior.** Brand → Home stays as-is.
- **Course overview reachability from the in-page Home content.** Out of
  scope for this phase; the recommended-lesson card and CTAs stay as-is.
  If a follow-up wants Home to expose a "Pregled kursa →" surface, it
  belongs in Phase 7.8 or 7.9, not here.
- **Active-state styling.** Inherits today's `.active` rule.

---

## 4. File-level bundle

One commit inside one PR.
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` green before push.

**Files modified (1) + verification touch (1):**

### CSS rule change

- [`packages/ui-web/src/primitives/TopBar/TopBar.module.css`](../packages/ui-web/src/primitives/TopBar/TopBar.module.css)
  — at the `@media (max-width: 720px)` block (line 100), change the
  `.nav a { display: none }` blanket rule to a targeted set of selectors
  that hide only the `Početna` and `O aplikaciji` anchors. The `Kurs`
  anchor stays visible.

  Today the three nav links are emitted with a stable href pattern:

  - `Početna` → `href="/"`
  - `Kurs` → `href={courseHref}` (a path beginning with `/course/`)
  - `O aplikaciji` → `href={aboutHref}` (a path beginning with `/o-aplikaciji`)

  Two equally clean ways to scope the hide rule:

  - **(i) Attribute selectors on `href`** — `.nav a[href="/"]` and
    `.nav a[href^="/o-aplikaciji"]` get `display: none`; the `Kurs` link
    falls through and stays visible. No JSX change needed. Brittle if
    the URL pattern changes, but those URLs are part of the routing
    contract and unlikely to move.
  - **(ii) Add stable class names in the TopBar JSX** — each link gets
    a stable identifier (e.g. `data-link="home"` / `data-link="course"` /
    `data-link="about"`) and the CSS targets those. Slightly more
    JSX-invasive but immune to URL changes.

  Recommendation in the detailed implementation: **(ii)** because the
  TopBar already has a clean `route` prop semantic and adding a
  `data-link` attribute alongside the existing `aria-current` is the
  more grep-able pattern. The decision is small enough to take during
  implementation, not in this plan; either is acceptable.

  Concretely, the rule changes from:

  ```css
  .nav a {
    display: none;
  }
  ```

  to (option ii illustrated):

  ```css
  .nav a[data-link='home'],
  .nav a[data-link='about'] {
    display: none;
  }
  ```

  And in `TopBar.tsx` each `<Link>` gains a `data-link` attribute
  matching `'home' | 'course' | 'about'`. The existing `aria-current` and
  `.active` class continue to work unchanged.

**Why the comment stays in spirit.** The CSS comment about "editorial
chrome rather than a web nav bar" is rewritten to read: "Mobile keeps
only `Kurs` as a text link — Brand carries Home, footer carries
`O aplikaciji`. Single section affordance preserves the masthead
register."

### Playwright assertion

- [`apps/web/e2e/smoke.spec.ts`](../apps/web/e2e/smoke.spec.ts) — add one
  new test, runnable on the `chromium-mobile` and `webkit-mobile`
  profiles, asserting:
  - On `/` the TopBar contains a visible link with accessible name `Kurs`
    pointing at `/course/istorija-srbije-365`.
  - Clicking it navigates to the course overview (`page.url()` matches
    `/course/istorija-srbije-365`).

  Existing assertions are not changed. New test is gated by viewport
  width like the other layout-sensitive tests in the file.

---

## 5. Verification (whole phase)

Per the 7.x cadence:

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green.
- Existing Playwright smoke (8 tests × 5 profiles = 40 runs, 38 pass / 2
  documented WebKit skips) passes unchanged.
- New Playwright assertion: 9th test × 5 profiles = 45 runs, expected
  43 pass / 2 documented WebKit skips. The new test runs on all
  profiles but is most load-bearing on `chromium-mobile` and
  `webkit-mobile`. On desktop profiles the assertion is trivially true
  (the link was always visible).
- Screenshot pack regenerated locally via `pnpm screenshots` and the
  mobile shots reviewed against today's baseline:
  - `mobile-home.png` — header now reads `[H] History 365 · Kurs · 0/365`.
  - `mobile-home-with-progress.png` — same, with progress count updated.
  - `mobile-course-overview.png` — `Kurs` active state visible.
  - `mobile-lesson-001.png` — `Kurs` active state visible (lesson route
    marks Kurs active per existing logic).
  - `mobile-lesson-001-sadrzaj-drawer.png` — drawer still functions; the
    TopBar behind the drawer is irrelevant to the drawer's behavior.
- Live audit at the local dev server (`pnpm dev`, port 3000) before
  marking the PR ready: open `/` on a 390px-wide window in DevTools,
  confirm Kurs visible, tap-navigate to course, then to lesson, then
  back to Home, confirm active state tracks correctly.

---

## 6. Risks

- **Header crowding at 360px.** Brand + Kurs + progress capsule must fit
  inside 360px (the iPhone SE width). Today's gap variable
  (`var(--space-4)`) plus the progress capsule (52px progress track +
  count text) plus Brand should leave room. Mitigation: at screenshot
  review, if the header looks tight at 360px, drop the gap to
  `var(--space-3)` inside the 460px media query (where the decorative
  progress mini-bar is already dropped). The progress count stays.
- **`Kurs` active state on the lesson page.** Today `Kurs` is the active
  link when `route === 'lesson'` ([`TopBar.tsx:29`](../packages/ui-web/src/primitives/TopBar/TopBar.tsx#L29)).
  On mobile the active state will now be visible. This is correct, but
  it does change how lesson pages look — the `Kurs` link will carry the
  `.active` class. Verify the active treatment reads well on a single
  visible link (currently styled assuming a row of three).
- **`aria-current="page"` on Kurs when on a lesson route.** Semantically
  the user is on a lesson, not on Kurs. The existing TopBar already
  emits `aria-current="page"` for `route === 'lesson' || 'course'`
  because Kurs is the parent section. The breadcrumbs carry the precise
  current page (`DAN nnn`). No change here, but flagging because making
  Kurs more visible makes this ARIA state more user-facing.
- **Brand-link tap target.** With one more text link adjacent, the
  Brand-link tap target might shrink. Mitigation: the existing CSS gives
  the Brand link adequate padding (verified during 6.4 mobile pass);
  recheck at screenshot review.

---

## 7. How to proceed

1. **Owner gives green-light to implement.** Decisions D1 + D2 + D3
   already locked above.
2. **Open `feat/phase-7-7-mobile-nav` off `main`** and land one commit:
   `feat(web): Phase 7.7 — keep Kurs link in mobile TopBar`.
3. **Push and open a draft PR** so the Vercel preview deploy generates a
   live URL.
4. **Owner previews the live site on mobile** (or DevTools at 390px) —
   from Home tap Kurs, from a lesson tap Kurs, confirm active state and
   tap-target feel.
5. **On approval the PR merges**, `docs/PROJECT_STATE.md` gains a
   "Phase 7.7 — Mobile global nav restoration: done" section, `HANDOFF.md`
   refreshes the next-step pointer to Phase 7.8 (Daily ritual anchor),
   and `docs/PHASE_7_7_PLAN.md` moves into `docs/archive/phases/`.

---

## 8. Out-of-scope reminders

This plan deliberately does **not** touch:

- The `Brand` component, its disc mark, or its href.
- `TopBar` props or the `route` semantic.
- The progress capsule (count, track width, label).
- The 460px media query (still drops the decorative track).
- Footer mounting or footer link set.
- Any in-page surface on Home, Course, or Lesson.
- The `aria-current` semantic.
- Anything in `apps/api` or backend.
