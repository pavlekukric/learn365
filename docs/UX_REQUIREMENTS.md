# UX Requirements

## Product experience summary

History 365 should feel like a premium course-based learning app.

The user should never feel lost.

The app must make the 365-day journey feel structured, motivating, and easy to continue.

## Information architecture

Main structure:

```txt
Home
  → Istorija Srbije 365
      → Course Overview
          → Historical Period / Chapter
              → Lesson
```

Example:

```txt
Home
  → Istorija Srbije 365
      → Praistorija i antika
          → Day 1: Lepenski Vir
          → Day 2: Vinčanska kultura
      → Doseljavanje Slovena i pokrštavanje
          → Day 13: Sloveni na Balkanu
      → Rana srednjovekovna država
          → Day 28: Stefan Vojislav
```

## Main navigation principles

The user should always see:

- current course
- current historical period
- current lesson
- total progress
- completed lessons
- next lesson

## Home page requirements

The Home page should not show the full lesson list.

It should be a premium introduction to the app.

Required sections:

### Hero section

Should communicate:

- 365-day Serbian history journey
- one short lesson per day
- structured learning
- premium reading experience

Possible hero copy:

```txt
365 days through Serbian history.

One short lesson per day.
A clear journey from the earliest cultures to the modern age.
```

### Value proposition section

Explain why the app exists:

- history is often fragmented
- this app turns it into a clear path
- lessons are short and readable
- progress is visible

### Course card section

Show the available course:

`Istorija Srbije 365`

The course card should include:

- title
- short description
- total lessons: 365
- estimated reading time per lesson
- progress if available
- CTA to enter course

### CTA

Primary CTA:

`Start learning`

or

`Open Istorija Srbije 365`

## Course overview page requirements

The course overview page appears after the user opens `Istorija Srbije 365`.

It should show:

- course title
- course description
- overall progress
- completed lessons count
- remaining lessons count
- current lesson
- next lesson
- historical periods
- progress per period
- continue button

### Course progress component

Example:

```txt
1 / 365 completed
0.3%
364 lessons remaining
```

### Continue learning card

Should show:

- current or next lesson title
- day number
- historical period
- reading time
- CTA: `Continue`

### Historical period list

Each period card/row should show:

- period title
- optional date range
- number of lessons
- completed count
- progress bar
- CTA or click behavior

## Lesson reader page requirements

The lesson reader is the core screen.

### Desktop layout

Desktop should use a two-column layout:

```txt
-------------------------------------------------------
Top bar / breadcrumbs / progress
-------------------------------------------------------

[ Course sidebar ]        [ Lesson content ]
[ collapsible ]           [ timeline ]
[ sticky ]                [ reading area ]
                           [ previous / complete / next ]
```

### Left sidebar

The sidebar should contain the full course outline.

Required sidebar elements:

- course title
- total progress
- list of historical periods
- collapsible chapters
- lessons inside chapters
- completed state
- active state
- not started state
- reading time
- day number

### Sidebar section behavior

Each historical period should be collapsible.

Collapsed state:

```txt
> Praistorija i antika       1/12
```

Expanded state:

```txt
v Praistorija i antika       1/12
  ✓ Day 1 — Lepenski Vir
  ○ Day 2 — Vinčanska kultura
  ○ Day 3 — Iliri, Tračani i Kelti
```

### Lesson row states

#### Completed lesson

- green circular checkmark
- visually clear but not too loud
- title remains readable

#### Active lesson

- highlighted background or border
- clear active indicator
- should be obvious at a glance

#### Not started lesson

- neutral circle or subtle marker
- visually quiet

### Main lesson content

The main content area should include:

- breadcrumbs
- lesson title
- day number
- historical period
- reading time
- year or date range if available
- historical timeline
- lesson body
- previous / next lesson controls
- mark as completed button

### Mark as completed behavior

When the user clicks `Mark as completed`:

- lesson becomes completed
- green checkmark appears in sidebar
- total progress updates
- course overview progress updates
- button changes to completed state

Possible completed button state:

`Completed ✓`

### Previous / next navigation

At the bottom of a lesson:

- previous lesson button
- next lesson button
- mark as completed button

Behavior:

- if lesson is not completed, primary action should be `Mark as completed`
- after completion, primary action can become `Next lesson`

## Breadcrumbs

Breadcrumbs should be visible on course and lesson pages.

Example:

```txt
Home > Istorija Srbije 365 > Rana srednjovekovna država > Stefan Vojislav
```

On mobile, breadcrumbs can be shortened:

```txt
Istorija Srbije 365 > Stefan Vojislav
```

## Historical timeline

The app should include a timeline with years or periods.

Purpose:

- help the user understand where the current lesson sits historically
- make history feel chronological
- provide visual orientation

Timeline should show:

- broad historical periods
- current lesson date/year/period highlighted
- subtle visual style
- not too large
- not distracting from reading

Possible desktop placement:

- above lesson content
- right side of lesson metadata
- below lesson header

Possible mobile placement:

- compact horizontal scroll
- small current-period indicator

## Progress requirements

Progress should exist at three levels:

### 1. Total course progress

Example:

```txt
1 / 365 completed
```

### 2. Section progress

Example:

```txt
Praistorija i antika
1 / 12 completed
```

### 3. Lesson state

Example:

```txt
Completed
Active
Not started
```

## Mobile requirements

Mobile should be reading-first.

The sidebar should not permanently take screen space.

Mobile patterns:

- `Lessons` button opens drawer/panel
- course outline appears inside drawer
- breadcrumbs simplified
- progress remains visible
- timeline becomes compact
- bottom navigation should be clean

Mobile priorities:

1. comfortable reading
2. easy access to lesson list
3. clear completion action
4. visible progress

## Empty / initial state

When user has completed nothing:

- progress: `0 / 365 completed`
- CTA: `Start with Day 1`
- no green checkmarks yet
- first lesson should be clearly suggested

## Visual UX requirements

The app should use:

- strong spacing
- refined typography
- subtle separators
- premium card design
- elegant but readable colors
- clear active states
- clear completed states

Avoid:

- too many colors
- cheap gamification
- generic dashboard layout
- dense lists
- unclear icons
- low contrast text
- cluttered mobile UI

## Accessibility requirements

The app should support:

- readable text sizes
- sufficient contrast
- keyboard navigation on web
- visible focus states
- accessible button labels
- non-color-only completion indicators
