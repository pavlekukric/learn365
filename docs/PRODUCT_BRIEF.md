# History 365 — Product Brief

## Product name

History 365 / Istorija 365

## Product idea

History 365 is a premium daily learning app where users learn Serbian history through 365 short lessons.

The app should make Serbian history easier to understand by turning it into a clear, structured, elegant learning journey.

## Core promise

Learn the history of Serbia in 365 short lessons.

One lesson per day.  
Clear historical structure.  
Premium reading experience.  
Visible progress from day 1 to day 365.

## Target user

The app is for people who want to understand Serbian history without reading huge books, scattered online articles, or fragmented sources.

Potential users:

- Serbian users who want to understand their history better
- People from the region interested in Serbian history
- Serbian diaspora
- Students
- History enthusiasts
- Adults who want structured daily learning
- People who like short daily educational habits

## Product positioning

This is not a blog.

This is not a random article collection.

This is not a generic learning dashboard.

This should feel like a premium structured course for history.

The experience should combine:

- Pluralsight-like clarity for course navigation
- Premium editorial reading experience
- Calm historical visual identity
- Simple daily progress tracking

## First course

The first course is:

`Istorija Srbije 365`

It contains 365 lessons grouped into historical periods.

## Learning format

Each lesson should:

- be one daily reading unit
- take around 7–10 minutes to read
- have a clear title
- belong to one historical period/chapter
- have a day number
- optionally have reading time
- optionally have year or date range
- be markable as completed

## Core user journey

1. User lands on Home page.
2. User understands what History 365 is.
3. User clicks into `Istorija Srbije 365`.
4. User sees course overview.
5. User sees total progress and list of historical periods.
6. User opens a lesson.
7. User reads the lesson.
8. User marks the lesson as completed.
9. The lesson gets a green circular checkmark.
10. Total progress updates from `1 / 365` to `2 / 365`, etc.
11. User can continue to the next lesson.

## Main screens

### 1. Home page

The Home page introduces the app.

It should explain:

- what the app is
- how the 365-day journey works
- why Serbian history is worth learning this way
- that each lesson is short and easy to read
- that the user can track progress

The Home page should have a clear call to action:

`Start Istorija Srbije 365`

or

`Enter the course`

### 2. Course overview page

The course overview page shows:

- course title
- short description
- overall progress
- current lesson
- next lesson
- historical periods/chapters
- progress per chapter
- call to action to continue learning

### 3. Lesson reader page

The lesson reader is the main learning experience.

Desktop layout:

- breadcrumbs at the top
- left sidebar with course outline
- collapsible chapters
- lessons inside each chapter
- completed lesson checkmarks
- active lesson state
- main reading area
- historical timeline
- previous / next lesson navigation
- mark as completed button

Mobile layout:

- reading-first experience
- lesson list available through drawer/panel
- simplified breadcrumbs
- progress visible
- clean navigation

## Visual identity

The product should feel:

- premium
- calm
- elegant
- educational
- historical
- trustworthy
- focused
- polished

It should not feel:

- cheap
- generic
- childish
- overly gamified
- like a SaaS admin dashboard
- like a simple blog
- like a basic documentation site

## Design principles

### 1. Clarity first

The user should always know:

- where they are
- what course they are in
- what period they are reading
- what lesson is active
- what they have completed
- what comes next

### 2. Premium simplicity

The app should feel simple, but not basic.

Every screen should feel intentional and polished.

### 3. Reading comfort

The reading experience should be calm and focused.

Typography, spacing, and contrast matter a lot.

### 4. Progress motivation

Progress should be visible but not aggressive.

This is not a game.  
It is a premium daily learning habit.

### 5. Course structure

The 365 lessons should not feel like a long flat list.

They should be grouped into meaningful historical chapters.

## V1 scope

V1 includes:

- Home page
- Course overview page
- Lesson reader page
- Desktop layout
- Mobile layout
- Course sidebar
- Collapsible historical periods
- Lesson completion
- Green checkmarks
- Active lesson state
- Total progress
- Historical timeline
- Local/mock progress state
- Mock/seed lesson data

## V1 exclusions

V1 excludes:

- payment
- subscriptions
- login
- backend persistence
- notifications
- streaks
- quizzes
- AI content generation inside the app
- admin content management
- public user profiles

## Future possibilities

Possible future features:

- user accounts
- cloud sync
- daily reminders
- streaks
- paid unlock
- multi-country courses
- multilingual lessons
- quizzes
- maps
- image galleries
- AI-assisted content pipeline
- admin CMS
- mobile push notifications

## Long-term platform direction

The first product is History 365 / Istorija 365.

However, the app should be designed with a generic 365-day learning model in mind.

The first course is Serbian history, but the same structure could later support other topics such as:

- world history
- geography
- science
- sport
- music
- film
- art
- culture

For v1, the product should stay focused on Serbian history.

The architecture should not hardcode the app only to history. It should use generic concepts:

- Course
- Section
- Lesson
- UserProgress

This allows History 365 to become the first vertical in a broader Learn 365-style platform later, without making the first version feel generic.
