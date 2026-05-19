# Phase 7.3 — Section in breadcrumb (PLAN)

**Status:** Draft, awaiting owner green-light to implement.
**Date:** 2026-05-18
**Predecessors:** Phase 7.2 — Home hero v2 shipped (mono date-line + Flourish
on the home hero, `HistoricalTimeline` `'home'` variant on the eras rail,
course-overview lede sourced from `course.description`).
**Parent references:**
- [`docs/NEXT_PHASE_RECOMMENDATION.md`](./NEXT_PHASE_RECOMMENDATION.md) §2 Pick 3
- [`docs/PHASE_7_2_PLAN.md`](./PHASE_7_2_PLAN.md) — bundle structure mirrored here
- [`docs/PROJECT_STATE.md`](./PROJECT_STATE.md) — "Phase 7.2 — Home hero v2:
  done" + "Next step" entry naming this phase

## Why this is the next phase

`Section` is one of the four primary content levels (`Course → Era → Section
→ Lesson`) but the lesson page's breadcrumb chain elides it. The live page
at <https://learn365-web.vercel.app/course/istorija-srbije-365/lesson/day-053>
renders today as:

```
Početna · Istorija Srbije 365 · Nemanjićka Srbija · DAN 053
```

The section ("Stefan Nemanja" for day 53) is visible only in the sidebar.
The *breadcrumb* — the canonical "where am I" device — skips it. This
phase inserts the section between era and day:

```
Početna · Istorija Srbije 365 · Nemanjićka Srbija · Stefan Nemanja · DAN 053
```

Real clarity win on the lesson page; touches one `useMemo`-built breadcrumb
array + one new `sectionHref` callback that mirrors the existing
`eraHref`. Low risk, one PR, easy revert.

---

## 1. Locked decisions

Confirmed with the owner before drafting the bundle. Both decisions were
sharpened by a live audit of <https://learn365-web.vercel.app/> in the
planning session (see the "Live audit findings" note at the end of §1).

### D1 — Insert section as the 4th crumb (between era and day)

Breadcrumb chain becomes 5 deep on the lesson page:
`Početna · {courseTitle} · {era.title} · {section.title} · DAN nnn`.

The lesson page is the only surface that gains a crumb — the course
overview's breadcrumb (if/when added) and the about page are unaffected.

**Layout safety.** [`Breadcrumbs.module.css`](../packages/ui-web/src/primitives/Breadcrumbs/Breadcrumbs.module.css)
already (a) `flex-wrap: wrap`s the list, and (b) at `≤560px` hides every
crumb except the last two via `.item:nth-last-child(n + 3) { display:
none }`. So:

- **Desktop / tablet (>560px):** all 5 crumbs render. Section titles in
  the course are 2–6 words (e.g. *"Praistorija Podunavlja"*, *"Stefan
  Nemanja"*, *"Knez Lazar i Kosovska bitka"*) so the chain fits one line
  at ≥860px and wraps to a tidy second line in the 561–860px band.
- **Mobile (≤560px):** the visible chain collapses from
  `{era} · DAN nnn` (today) to `{section} · DAN nnn` (after this phase).
  This is a clarity **upgrade** — section is the more specific parent;
  the era is still reachable via the sidebar accordion and the
  `LessonContextHeader`'s era label row.

No CSS rule change is required for this to work; the existing rule already
counts back from the end of the list. One extra `≤860px` defensive rule is
held back as a contingency only if QA finds the 5-crumb chain wrapping
awkwardly at that tablet band — see §3.3.

**Why this and not "drop era, keep section."** Era is what the user reads
in the page eyebrow + context header + timeline marker — pulling it out of
the breadcrumb breaks the sense of historical place. Section is what the
*sidebar* organises around; adding it makes the breadcrumb match the
sidebar tree the user is staring at on every lesson view.

### D2 — Section crumb links to the section's first lesson

`href = /course/{courseId}/lesson/{firstLessonInSection.id}`. Implemented
as a new `sectionHref` `useCallback` in `LessonPageClient.tsx` mirroring
the existing `eraHref` callback ([line 123-131](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx#L123-L131)):

```tsx
const sectionHref = useCallback(
  (sectionId: string) => {
    const firstInSection = lessons.find((l) => l.sectionId === sectionId);
    return firstInSection
      ? `/course/${courseId}/lesson/${firstInSection.id}`
      : `/course/${courseId}`;
  },
  [courseId, lessons],
);
```

The `Lesson.sectionId` field already exists ([packages/content/src/types.ts:74](../packages/content/src/types.ts#L74)),
so the lookup walks the already-loaded `lessons` array — no new content
helper, no new import.

**Why this over the alternatives the planning round considered:**

This decision was reopened after the live audit revealed that the **era
crumb already links to the era's first lesson** (`Nemanjićka Srbija` →
`/course/istorija-srbije-365/lesson/day-046` on the live page) via the
existing `eraHref` callback. Three options were on the table:

- **Section crumb → `#era-section-{id}` anchor on course overview.** Was
  the initial recommendation. Rejected on consistency grounds — the era
  crumb behaves as "navigate to first lesson," so a section crumb that
  *suddenly* deep-links to a different surface (the course overview with
  a hash + auto-expand + scroll handler) would read inconsistently.
  Would also have required: (a) a mount-time `useEffect` in
  `CourseOverviewEras` to read `window.location.hash`, open the matching
  accordion, and scroll, AND (b) restructuring the section row so the
  anchor `id` lives on an always-rendered wrapper instead of the
  conditionally-mounted panel `<ol>` (currently at
  [CourseOverviewEras.tsx:117](../apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L117),
  inside the `{isOpen ? … : null}` block — would `scrollIntoView` against
  a non-existent element until the section opened).
- **Section crumb → non-navigable span.** Cheapest, but leaves a real
  clarity affordance unbuilt — once the crumb appears as a label users
  will try to click it.
- **Reform both crumbs together — era + section → `#anchor` on course
  overview.** Cleanest end-state but biggest blast radius — touches
  `eraHref` which is also used by `HistoricalTimeline.eraHref`, plus
  needs the always-rendered-id refactor of `CourseOverviewEras`. Out of
  scope for this phase; can be revisited if the lateral-move pattern
  proves wrong in practice.

**Trade-off the owner accepted.** "Sibling-lateral" is a fair criticism
of the section crumb under this option, but it applies equally to the
era crumb today — and consistency between the two beats theoretical
correctness of one of them. If the lateral pattern ever needs reforming,
both crumbs reform together.

### D3 — One PR, one commit, no Playwright assertion expansion

This is a single small change: one new `sectionHref` callback + one
extended breadcrumbs array + one extended dependency list. Ships as one
commit in one PR. One screenshot review at the end.

No new Playwright tests are planned. The Breadcrumbs primitive already
has unit-level coverage of `href` rendering via 6.8d work and the lesson
e2e smoke continues to assert the breadcrumb landmark exists; the section
crumb's content is data-driven from `section.title` and doesn't need a
dedicated assertion. One optional assertion is sketched in §3.2 — held
back unless requested.

### Live audit findings (2026-05-18)

Sharpened D2 and a slug detail. Recorded here so the trail is auditable.

- **Lesson id pattern is `day-NNN`**, not `{eraId}-NNN` as earlier docs
  implied. Confirmed via `_generated.ts` (e.g. `day-053`,
  `praistorija-i-antika-001` is **not** a current valid id — the latter
  appears in historical PROJECT_STATE.md entries from an earlier content
  generation). All examples in this plan use `day-NNN`.
- **Today's lesson breadcrumb is 4 deep**, era crumb already navigates
  to the era's first lesson. Sets up D2's consistency argument.
- **Course overview accordion panel ids are client-rendered + open-only.**
  No `era-section-{id}` element exists in initial HTML; even after the
  accordion mounts, the `id={panelId}` lives inside `{isOpen ? … :
  null}`. This is why the original `#anchor`-based D2 was rejected —
  not just an inconsistency, but a meaningful additional refactor of
  `CourseOverviewEras`.

---

## 2. Out of scope (deliberately)

Holding the blast radius small. Specifically excluded:

- **No `Breadcrumbs` component API change.** `BreadcrumbItem` already
  supports `href`; the lesson page just composes one more item.
- **No `CourseOverviewEras` change.** The course overview page is
  untouched. No hash handler, no anchor refactor, no accordion
  restructuring. (Listed explicitly because the earlier draft of this
  plan added all three.)
- **No `eraHref` reform.** Era crumb stays lateral-to-first-lesson as
  today. If both crumbs ever need to deep-link to the course overview,
  that is a future, larger phase.
- **No new section route.** No `/course/{cid}/section/{sid}` page.
- **No course-overview breadcrumb.** The course overview page does not
  currently render `Breadcrumbs`; this phase doesn't add one.
- **No content model change.** Section already has `title`, `id`,
  `eraId`; `Lesson` already has `sectionId`.
- **No mobile breadcrumb redesign.** The existing `≤560px` "last two
  crumbs only" rule is correct for the new 5-crumb chain (it now
  surfaces section instead of era, which is *more* specific).
- **No section-crumb "always interactive even as last crumb" override.**
  Section is the 4th crumb, not the last, so it renders as a `<Link>`
  naturally. No primitive change needed.

---

## 3. File-level bundle

One commit. One file modified.

### 3.1 — Insert section crumb in the lesson page

**Goal:** the lesson page's breadcrumb chain reads
`Početna · {course} · {era} · {section} · DAN nnn` with the section as a
real `<Link>` pointing at the section's first lesson.

**Files modified (1):**
- `apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx`
  — two adjacent changes:

  **a. Add a `sectionHref` `useCallback`** alongside the existing
  `eraHref` ([line 123-131](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx#L123-L131)):

  ```tsx
  const sectionHref = useCallback(
    (sectionId: string) => {
      const firstInSection = lessons.find((l) => l.sectionId === sectionId);
      return firstInSection
        ? `/course/${courseId}/lesson/${firstInSection.id}`
        : `/course/${courseId}`;
    },
    [courseId, lessons],
  );
  ```

  Type of the `sectionId` parameter can also be the registry's `SectionId`
  branded type (already imported at [line 14](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx#L14)),
  which is preferable. Final shape will match the existing `eraHref` style.

  **b. Extend the `breadcrumbs` `useMemo`** ([line 153-161](../apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx#L153-L161))
  to insert a 4th item between the era and the day:

  ```tsx
  const breadcrumbs = useMemo(
    () => [
      { label: 'Početna', href: '/' },
      { label: courseTitle, href: `/course/${courseId}` },
      { label: era.title, href: eraHref(era.id) },
      { label: section.title, href: sectionHref(section.id) },
      { label: `DAN ${String(lesson.dayNumber).padStart(3, '0')}` },
    ],
    [courseTitle, courseId, era.title, era.id, eraHref,
     section.title, section.id, sectionHref, lesson.dayNumber],
  );
  ```

  Dependency array gains `section.title`, `section.id`, `sectionHref`.

**Unchanged:**
- `Breadcrumbs.tsx` / `Breadcrumbs.module.css` — primitive untouched.
- `CourseOverviewEras.tsx` — entirely untouched.
- Lesson page route, lesson reader, sidebar — all untouched.
- `LessonReader` — receives the longer breadcrumbs array as before; no
  prop signature change.
- The server-side lesson page (`page.tsx`) — already looks up the
  section and threads it through.

**Why it's safe:** one new callback, one `useMemo` value extended, one
dependency array extended. The crumb's `href` always resolves to a valid
lesson URL (the `firstInSection` fallback handles a defensive case that
shouldn't occur — every section has lessons per content validation).

**Verification:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Manual: load several lessons (Day 1, Day 7 authored, Day 53 in a
  different era, Day 106 era-boundary, Day 200 placeholder) and confirm
  the breadcrumb shows 5 items on desktop, 2 items on a ≤560px viewport
  with the section crumb visible as the parent of DAN.
- Manual: click the section crumb → expects to land on
  `/course/.../lesson/{firstLessonInSection.id}`. From Day 53 (Stefan
  Nemanja section, days 48-53) → Day 48.
- Manual: confirm clicking the section crumb does not surprise the user
  by jumping mid-section to a different era. (It shouldn't — each
  section is fully inside one era.)
- Playwright smoke continues to pass — the existing breadcrumb-rendering
  smoke asserts the landmark exists; the new crumb is data-driven.

### 3.2 — Optional: one Playwright assertion (held back unless owner asks)

If belt-and-braces is wanted, one assertion can be added to
`apps/web/e2e/smoke.spec.ts`:

```ts
test('lesson breadcrumb shows section', async ({ page }) => {
  await page.goto('/course/istorija-srbije-365/lesson/day-053');
  const bc = page.getByRole('navigation', { name: 'Breadcrumbs' });
  // Section sits between era and DAN
  const sectionLink = bc.getByRole('link', { name: 'Stefan Nemanja' });
  await expect(sectionLink).toBeVisible();
  // It points to the section's first lesson (day-048)
  await expect(sectionLink).toHaveAttribute(
    'href', '/course/istorija-srbije-365/lesson/day-048',
  );
});
```

Not included in the default bundle — the breadcrumb's content is purely
data-driven from registry data already covered by content/unit tests, and
the assertion above hard-codes a content slug (`day-048`) that would
break if Stefan Nemanja's day range is ever re-tuned. Holding for owner's
call.

### 3.3 — Optional CSS contingency (held back unless QA finds wrap awkwardness)

If the 5-crumb chain wraps awkwardly in the 561–860px band, a single
defensive rule can be added to `Breadcrumbs.module.css`:

```css
@media (max-width: 860px) and (min-width: 561px) {
  /* Tablet: collapse Početna so the chain fits one line. */
  .item:nth-child(1) { display: none; }
  /* Or alternatively: .item:nth-child(2) (course title) — pick whichever
     reads better on the actual viewport. */
}
```

Not included in the default bundle — added only if screenshot review
flags it. The default `flex-wrap: wrap` is likely sufficient.

---

## 4. Engineering gates

One commit, full gates locally before the PR opens:

- `pnpm typecheck` (6 packages)
- `pnpm lint`
- `pnpm test` (Vitest — 79 unit tests; no new tests planned, the change
  is composition with no math)
- `pnpm build` (5 routes; lesson route bundle expected unchanged or
  within ±0.05 kB)
- `pnpm validate-content` (no content changes; sanity check only —
  365/28/8 should remain green)
- `pnpm --filter @learn365/web test:e2e` (Playwright — no new assertions
  planned; existing home / course / lesson smoke must continue to pass)

---

## 5. How to proceed

1. **Owner reviews this plan** and green-lights or flips D1 / D2 / D3.
   D2 in particular was reopened after the live audit — if the
   consistency argument feels wrong on a second read, flip back to the
   `#anchor` option (and accept the larger blast radius spelled out in
   D2's rejected-alternatives note).
2. **I open `feat/phase-7-3-section-in-breadcrumb` off `main`** and
   land one commit modifying `LessonPageClient.tsx`. Engineering gates
   pass locally before the push.
3. **I push and open a draft PR** so the Vercel preview deploy
   generates a live URL.
4. **Owner previews the live site** — load a few lessons (Day 53 in
   Stefan Nemanja, an authored lesson, a placeholder), click the new
   section crumb, confirm it jumps to the section's first lesson.
   Cross-check mobile (≤560px) shows `{section} · DAN nnn` and not
   `{era} · DAN nnn`. Either approves or calls out anything that
   doesn't read right.
5. **On approval the PR merges**, `PROJECT_STATE.md` is updated with a
   `Phase 7.3 — Section in breadcrumb: done` section, and the phase is
   closed.
6. **Next-phase candidate after 7.3:** Phase 8 (Backend / .NET)
   becomes viable per `BACKEND_STRATEGY.md` — the v1 web UI will be at
   parity with the lesson-reader benchmark across every surface. If
   owner prefers more UI polish first, the housekeeping cluster
   (`CONTACT_EMAIL` swap, `COMPONENT_LIBRARY.md` revision,
   VoiceOver/NVDA smoke, editorial review of the 6 authored seed
   lessons) is the natural smaller next step.

---

## 6. Out-of-scope reminders & housekeeping

This plan deliberately does **not** touch:

- Editorial color / type / motion tokens.
- The `Breadcrumbs` primitive component.
- `CourseOverviewEras` and the course overview page.
- The `LessonReader`, `LessonHeader`, `LessonContextHeader`,
  `CourseSidebar` — all untouched.
- The home page, the about page, the course-overview hero — all
  untouched.
- Authored lesson content — separate workflow.
- Anything in `apps/api` or backend — Phase 8 territory.

**Housekeeping (not blocking, surface here so it isn't lost):**

- **Production contact email.** `apps/web/app/o-aplikaciji/_copy.ts`
  still ships `CONTACT_EMAIL = 'kontakt@history365.app'` as a
  placeholder. Must be swapped for the real address before public
  launch. Carried forward from `PROJECT_STATE.md` "Next step" and
  PHASE_7_2_PLAN §7. One-line copy swap; can ship in any small drive-by
  PR.
- **`COMPONENT_LIBRARY.md` revision.** The doc still needs the
  `onClick → href` revision for navigation props called out at the end
  of Phase 3 ([PROJECT_STATE.md:818](./PROJECT_STATE.md#L818)). Outside
  this phase but stale enough that next session should grab it.
- **Screen-reader smoke.** VoiceOver / NVDA on TopBar nav +
  breadcrumbs + accordion + completion toggle. The breadcrumb chain
  grows in this phase — would be a good moment to do the smoke pass.
- **Editorial review of the 6 authored seed lessons** for historical
  voice, accuracy, period coverage.

---

## 7. Risk + revert plan

**Risk profile.** Very low. One composition change in one client
component file.

**Single most likely regression** is a stale `useMemo` dependency — if
`section.title` / `section.id` / `sectionHref` aren't all in the
dependency array, the section crumb could go stale across lesson
navigations within the same section. Mitigation: the dependency list in
§3.1.b is the canonical shape; React's `react-hooks/exhaustive-deps`
lint rule will catch any omission at PR time.

**Revert plan.** One commit on a feature branch. Revert is
`git revert <commit>`. No DB, no API, no content, no token changes. No
follow-up phases depend on this one for v1 — Phase 8 (Backend) doesn't
read the breadcrumb composition.
