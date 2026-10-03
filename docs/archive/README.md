# docs/archive

Historical documents. **Do not treat anything in this folder as a description of current state.**

These docs captured the situation that was true at the time they were written. The work they describe has shipped or been superseded. They are kept for archaeology — to answer "why did we build it this way?" or "what was the rationale at the time?" — not to inform new work.

For the current baseline, start at the repo root:

- [README.md](../../README.md) — product overview
- [HANDOFF.md](../../HANDOFF.md) — what is true now + what to do next
- [docs/PROJECT_STATE.md](../PROJECT_STATE.md) — current baseline + the newest phase entries

## Contents

### `PROJECT_STATE_PHASE_LOG.md` — the phase log, Phases 0–16

The append-only build log that followed the baseline in PROJECT_STATE until 2026-09-30, moved here unchanged (review 2026-09-30, item 17). Phase 17 onward is appended to PROJECT_STATE.

### Early plans and the design origin

Moved from `docs/` on 2026-10-03 (review 2026-10-03 P2 12 / 2026-10-01 item 16).

- `IMPLEMENTATION_PLAN.md` — the original "canonical plan" (Phases 0–8). Still says the app is on Vercel (deleted 2026-09-28); the phase log in PROJECT_STATE replaced it.
- `ROADMAP_PRE_PHASE_8.md` — the 2026-05-19 roadmap draft (bundles 7.5–7.12, all shipped).
- `CLOUD_DESIGN_PROMPT.md` — the prompt that produced the Cloud Design V1 prototype in `design/cloud-design-v1/`. Its "History 365" brand and 7–10-minute lessons are out of date.

### `phases/` — completed phase plans

Each file was the in-flight plan for a single feature bundle. The implementation is now merged into `main`. Completion is recorded in `docs/PROJECT_STATE.md`.

- `PHASE_6_7_MOBILE_LESSON_CONTEXT.md` — compact mobile lesson header + combined drawer (shipped as Phase 6.7).
- `PHASE_6_8_DECLUTTER_PLAN.md` — eight sub-bundles 6.8a–h (sidebar trim, breadcrumb links, era accordion, article anchor, timeline marker, day-label norm, placeholder styling). All shipped as Phase 6.8.
- `PHASE_7_0_PLAN.md` — footer + about page + breadcrumb additions (shipped as Phase 7.0a–e).
- `PHASE_7_1_PLAN.md` — top-bar styling, hero tidy, course-page polish (shipped as Phase 7.1a–d).
- `PHASE_7_2_PLAN.md` — Home era timeline, course clarity, continue state (shipped as Phase 7.2a–f).
- `PHASE_7_3_PLAN.md` — section crumb in lesson breadcrumb + sidebar indent guide (shipped as Phase 7.3a–b).
- `PHASE_7_4_PLAN.md` — eras as editorial blocks on course page, eras default closed on fresh state (shipped 2026-05-19, merge `f6a849f`).
- `PHASE_8_PLAN.md` — accounts: Google sign-in, Postgres on the VPS, sync beside the local stores, the ask after the second lesson (shipped 2026-09-27, PR #34 `06e6a55`, switched on the same day). Its `./…` links assume the old `docs/` location.
- `PHASE_9_PLAN.md` — the lesson corpus out of the client bundle (`LessonSummary` index + server-only `LessonArticle` behind `@learn365/content/server`) and the course + 365 lesson pages prerendered, with a bundle budget in CI (review P1 items 6 + 7; shipped 2026-09-28, PR #40 `6a0a533`, deployed the same day). One deviation recorded in PROJECT_STATE: route budget 175 kB gzip, not 150. Its `./…` links assume the old `docs/` location.

### `reviews/` — superseded UX reviews and audits

Each file captured a live read of the app at a point in time and produced recommendations. The recommendations have been consumed (either shipped, deferred to backlog, or rejected). Re-running the same kind of review against the current build is more useful than re-reading these.

- `UX_REVIEW_2026-05-15.md` — post-7.1 review. All five identified bundles shipped by Phase 7.1.
- `UX_AUDIT_CURRENT_UI.md` — live audit of the post-7.0e build. Main finding (course-page eras as editorial blocks) shipped as Phase 7.4.
- `NEXT_PHASE_RECOMMENDATION.md` — phase pick rationale. All three picks (7.1 trust polish, 7.2 home hero v2, 7.4 eras editorial) shipped. Replaced by `HANDOFF.md` at repo root as the live forward-looking pointer.
- `DESIGN_REVIEW.md` — the Cloud Design V1 approval and its implementation rule (the design source is still `design/cloud-design-v1/`; the live system is `docs/DESIGN_SYSTEM.md`).
- `PRODUCT_REVIEW_2026-09-28.md` — full review, 7 / 10. Its engineering backlog shipped as the P0 fixes and Phases 9–15.
- `PRODUCT_REVIEW_2026-09-30.md` — full review, 7.5 / 10. Its engineering backlog shipped as Phase 17; the content items led to Phases 19–20.

The newer reviews (`PRODUCT_REVIEW_2026-10-01.md`, `PRODUCT_REVIEW_2026-10-03.md`) stay in `docs/` while their items are open.

## When to consult an archived doc

- **Investigating an unexpected pattern** — "why does `CourseOverviewEras` route the disclosure through `CourseCard.description`?" The phase plan often explains the decision that the code itself cannot.
- **Writing a similar feature** — the bundle structure (commits, locked decisions, gates) in the 7.x plans is a useful template for new phases.
- **Reading commit messages or PR titles that reference `Phase X.Y`** — the matching plan is here.

## When NOT to consult an archived doc

- To learn the current state of any component, route, or content shape — read the code, or read `PROJECT_STATE.md` / `HANDOFF.md`.
- To plan the next phase — start a new plan informed by a fresh live audit. The recommendations in the archived reviews are stale.
