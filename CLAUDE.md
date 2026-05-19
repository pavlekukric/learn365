# Claude Project Instructions

## Project

History 365 / Istorija 365

## Main instruction

Before making any decision, read and follow:

- HANDOFF.md — what is true now and the live next-step pointer
- docs/PROJECT_STATE.md — current baseline (do not regress) + phase history
- docs/PRODUCT_BRIEF.md
- docs/UX_REQUIREMENTS.md
- docs/CONTENT_MODEL.md — canonical content contract
- docs/AGENTS.md

Completed phase plans and superseded reviews live in `docs/archive/`. Do **not** treat anything in `docs/archive/` as a description of current state.

## Product goal

Build a premium daily learning app for Serbian history.

The first course is:

`Istorija Srbije 365`

It contains 365 short lessons grouped into historical periods.

## Design goal

The app must feel full premium.

Navigation clarity should be similar to Pluralsight.

Visual feeling should be:

- premium
- elegant
- calm
- historical
- editorial
- modern
- highly polished

Avoid:

- generic SaaS dashboard
- basic blog layout
- clutter
- cheap gamification
- low-quality visual hierarchy

## V1 focus

Focus only on:

- Home page
- Course overview
- Lesson reader
- sidebar navigation
- lesson completion
- progress
- historical timeline
- responsive web/mobile experience

## Do not implement yet

Do not implement:

- payments
- login
- subscriptions
- backend persistence
- push notifications
- streaks
- quizzes
- admin panel
- CMS

Unless explicitly requested.

## Development style

Work in small safe steps.

Before coding:

1. inspect current files
2. explain planned changes
3. keep architecture clean
4. avoid overengineering
5. preserve premium UX

After coding:

1. run typecheck/build/tests if available
2. summarize changed files
3. update docs/PROJECT_STATE.md
4. list remaining work

## Component expectations

Expected reusable components:

- Breadcrumbs
- CourseCard
- CourseProgress
- CourseSidebar
- CourseSectionAccordion
- LessonNavItem
- CompletionCheckmark
- HistoricalTimeline
- LessonHeader
- LessonReader
- PreviousNextLessonNavigation
- MarkAsCompletedButton
- MobileLessonDrawer

## Data expectations

Use a clean content model:

- Course
- HistoricalPeriod
- Lesson
- UserProgress

For v1, progress can be local/mock state.

Do not hardcode UI logic directly into screens if it should belong to data or components.

## Quality bar

The app should look and feel like a serious product.

If a design or implementation feels average, generic, or messy, improve it before moving forward.
