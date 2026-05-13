# Project State

## Current phase

Phase 0 — New project foundation.

We are starting a completely new version of History 365 from scratch.

The previous prototype should be treated only as learning material. It should not constrain the new product.

## Current goal

Create a clean product, UX, and design foundation before writing implementation code.

## Product direction

History 365 is a premium daily learning app for Serbian history.

The first course is:

`Istorija Srbije 365`

The course has:

- 365 lessons
- one short lesson per day
- 7–10 minutes reading time per lesson
- chapters based on historical periods
- clear progress
- completed lesson checkmarks
- premium reading experience

## V1 scope

V1 should include:

- Home page
- Course overview page
- Lesson reader page
- Desktop layout
- Mobile layout
- Course sidebar
- Collapsible chapters
- Completed lesson state
- Active lesson state
- Not started lesson state
- Mark as completed action
- Total progress: `x / 365 completed`
- Historical timeline
- Mock/seed content
- Local progress state

## V1 exclusions

Do not implement yet:

- payment
- subscriptions
- login
- backend persistence
- push notifications
- streaks
- quizzes
- admin panel
- AI content generation pipeline
- CMS

## Design priority

The app must feel full premium.

The design must be:

- polished
- calm
- elegant
- modern
- historical
- highly readable
- simple but not basic

The app must not look like:

- a generic SaaS dashboard
- a basic blog
- a cheap course website
- a childish gamified app

## Key UX priority

The user should always understand:

- where they are
- what lesson is active
- what they completed
- what comes next
- how far they are in the 365-day journey

## Next step

Run Cloud Design using:

`docs/CLOUD_DESIGN_PROMPT.md`

Expected Cloud Design output:

- UX strategy
- information architecture
- desktop mockups
- mobile mockups
- home page concept
- course overview concept
- lesson reader concept
- sidebar states
- progress component concept
- historical timeline concept
- design system direction
- implementation notes

## Important instruction

Do not start coding before the design direction is reviewed and approved.

## Current status

Cloud Design V1 has been generated and visually approved.

The design prototype is located in:

`design/cloud-design-v1/`

The implementation should use this prototype as the visual source of truth, but production code should be structured cleanly and not blindly copied from the prototype.

## Next step

Start implementation planning with Cloud Code.

Cloud Code should first inspect the documentation and design prototype, then produce a detailed implementation plan before writing production code.