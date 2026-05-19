# Next-phase recommendation

**Date:** 2026-05-17
**Author:** Claude session prior to chat clear
**Status:** Recommendation only. No code changes proposed yet.
**Predecessors:** Phase 6.8, 6.9, 7.0a–e all shipped.
**Inputs reviewed:** `docs/PROJECT_STATE.md`, `docs/PHASE_7_0_PLAN.md`,
the live screenshot pack from 7.0e
(`screenshots/desktop/`, `screenshots/mobile/`), and the home / course /
lesson source under `apps/web/app/`.

This doc captures (1) an honest read of the current UI's look-and-feel and
(2) an ordered list of candidate next phases with a recommendation. The
next chat session should pick one item and promote it into a full
`PHASE_X_X_PLAN.md` before writing code.

---

## 1. UI assessment from current build

### What's working — it lands "premium / editorial"

- **Lesson reader is the strongest screen.** Drop-cap paragraph, quiet
  eyebrow above the title (`8 min čitanja · oko 9500. p.n.e.`), calm
  sidebar, inline timeline strip at the top of the reader column. Reads
  like a publication, not a SaaS dashboard. Shippable as-is.
- **Course overview accordion** (eras → sections → lessons) is dense
  without being cluttered. The nested expansion shows information depth
  while staying scannable.
- **Home hero typography.** Spectral display title on the parchment wash
  is the right register.
- **TopBar** is properly minimal now that `O aplikaciji` is gone (7.0d).
- **Token discipline.** Whitespace, rule lines, the green completion
  accent — all restrained and consistent across surfaces. The OKLCH +
  CSS-Modules system is paying off.

### Where it still falls short of "fully premium"

1. **Home hero below the fold is the weakest area.** The
   `Prva lekcija / Lepenski Vir` card and the `Osam epoha / Putovanje
   kroz 365 dana` eras strip are visually thin. The eras strip in
   particular feels like a band of tabs, not the centerpiece of a
   365-day journey it ought to be.
2. **Course overview hero is bare.** "Istorija Srbije 365" sits alone
   above the CourseProgress card with no eyebrow, no scene-setting —
   reads slightly empty compared to the lesson page's confidence.
3. **The era timeline rail on the home page** is visually quieter than
   the rail on the lesson page. The most-seen screen underplays the
   element that should be most ambient.
4. **No footer or `/o-aplikaciji` page yet.** Single biggest "is this a
   real product?" gap for a first-time visitor. Already known —
   Phase 7.1 in the existing roadmap.

**Overall:** ~85% of the way to "fully premium." Lesson reader is the
benchmark; the home page is the thing keeping the product from feeling
launched.

### Caveat

Assessment is from screenshots and source, not a live browser walkthrough.
The first action of any subsequent phase should be a live audit of
https://learn365-web.vercel.app/ — at minimum to confirm these
observations before designing against them.

---

## 2. Candidate next phases — ranked

Three picks, in recommended order. Each is self-contained and small enough
to be one PR.

### Pick 1 (recommended) — Phase 7.1: Trust polish

**Why first:** Highest trust-per-line-of-code in the backlog. The lack of
any footer or about page is the single biggest "is this a real product?"
signal a first-time visitor would clock. Building it unlocks restoring
the TopBar's `O aplikaciji` link as a real `<Link>` (Phase 7.0d removed
the disabled span as a holdover).

**Scope (already sketched in `PHASE_7_0_PLAN.md` §6):**
- New route `/o-aplikaciji`: mission, editorial standard, sources note,
  editor, contact. Editorial visual language matching the lesson reader
  — not a marketing page.
- Minimal editorial footer on every route: imprint, sources line,
  copyright, link to `/o-aplikaciji`. One reusable component in
  `@learn365/ui-web/primitives`.
- Restore TopBar `O aplikaciji` link.

**Risk:** Low. New surfaces, no removal of existing behaviour. The
footer is the only cross-route change.

**Verification:** Standard gates (`pnpm typecheck && pnpm lint && pnpm
test && pnpm build`), Playwright run after footer addition (every page
now has a new landmark), and screenshot regression on home / course /
lesson with the new footer.

### Pick 2 — Home hero v2

**Why:** The home page is the thing gating "this feels finished." Even
after 7.1, the hero block + eras rail are the visual weak point.

**Not in the existing roadmap.** Would need its own plan doc. Open
questions to settle before scoping:

- **Eras rail weight.** Give it more vertical presence — taller band,
  visible year labels, optional "you are here" marker keyed off
  `lastOpenedLessonId`. Should it become a small version of the
  lesson-page journey rail, sharing one component?
- **Hero ornamentation.** A thin opening line from Day 1, a serif pull
  quote, a date line ("Dan 1 · ~9500 p.n.e.") — something to make the
  hero confident without becoming busy.
- **Course overview hero parity.** If the home hero gains eyebrow /
  ornament, the course overview hero should match — currently it's the
  bare one.

**Risk:** Medium. This is the first phase since 6.x that adds visual
weight rather than removing it. Easy to break the calm. Plan should be
tight: one bundle, one screenshot review, easy revert.

**Verification:** Live browser comparison home vs. lesson page — they
should now read with equal confidence.

### Pick 3 — Phase 7.2: Section in breadcrumb

**Why:** Real clarity win on the lesson page. Section is currently
invisible in the breadcrumb chain (`Početna · Kurs · Era · Dan nnn`)
even though it's a load-bearing organisational level. Already in the
roadmap.

**Risk:** Low. Touches `Breadcrumbs` + lesson page composition. Requires
deciding whether the section crumb deep-links to `#section-id` on the
course page or to the section's first lesson.

---

## 3. Deferred — do not pick yet

- **Phases 7.3 / 7.4 / 7.5** from `PHASE_7_0_PLAN.md` §6. All are
  valid; none are urgent. Pick them up once the home page feels finished.
- **Phase 8 (backend / .NET).** Per `BACKEND_STRATEGY.md`, this kicks in
  *after* the web v1 is visually approved. Backend work will not make
  the product feel more premium — the visual bar is what's gating
  "shippable." Do not start until home page is at lesson-reader quality.
- **Hero backdrop QA pass** at 360 / 768 / 1280 / 1920. One-off check,
  not a phase.

---

## 4. Suggested handoff to next session

The new chat should:

1. **Read this doc first**, then `PROJECT_STATE.md` "Next step" section.
2. **Optionally walk the live build** at https://learn365-web.vercel.app/
   (home, course, lesson Day 1, lesson Day 7 completed-moment, lesson
   placeholder — desktop + mobile) before locking the pick. If the live
   read differs from this assessment, trust the live read.
3. **Confirm the pick with the owner** before writing any plan.
4. **Promote the chosen pick into `docs/PHASE_X_X_PLAN.md`** following
   the structure of `docs/PHASE_7_0_PLAN.md` (locked decisions, scope
   reframe, file-level bundle, verification, deferred items).
5. **Wait for green-light before implementation** — per the
   `plan-before-code` standing instruction.
