# Content Model

> **Canonical content contract.** This document defines the entity shapes (`Course`, `Era`, `Section`, `Lesson`, `LessonBlock`, `UserProgress`) used by the app. Treat the types and field lists here as the source of truth. For the mechanics of writing a lesson (file layout, validator, MDX migration path), see [`CONTENT_AUTHORING.md`](./CONTENT_AUTHORING.md).

## Overview

The app is built around a simple course model.

The first course is:

`Istorija Srbije 365`

It contains 365 lessons grouped into historical periods.

## Entities

## Course

A course represents a full learning journey.

Example:

```json
{
  "id": "serbian-history-365",
  "title": "Istorija Srbije 365",
  "subtitle": "365 dana kroz istoriju Srbije",
  "description": "A structured daily journey through Serbian history, from prehistory to the modern age.",
  "totalLessons": 365,
  "language": "sr",
  "defaultScript": "latin"
}
```

Fields:

- id
- title
- subtitle
- description
- totalLessons
- language
- defaultScript
- estimatedMinutesPerLesson — derived by the loader (median of the lessons' reading minutes), never authored (Phase 11)
- coverImage optional

## HistoricalPeriod / Chapter

A historical period groups lessons by theme and chronology.

Example:

```json
{
  "id": "prehistory-and-antiquity",
  "courseId": "serbian-history-365",
  "title": "Praistorija i antika",
  "subtitle": "Od najstarijih kultura do rimskog nasleđa",
  "dateRangeLabel": "pre 7000. p.n.e. – 6. vek",
  "startDay": 1,
  "endDay": 12,
  "order": 1
}
```

Fields:

- id
- courseId
- title
- subtitle optional
- dateRangeLabel optional
- startDay
- endDay
- order
- description optional

## Lesson

A lesson is one daily reading unit.

Example:

```json
{
  "id": "day-001-lepenski-vir",
  "courseId": "serbian-history-365",
  "periodId": "prehistory-and-antiquity",
  "dayNumber": 1,
  "title": "Lepenski Vir",
  "subtitle": "Jedna od najvažnijih praistorijskih kultura na Dunavu",
  "dateLabel": "oko 9500–6000. p.n.e.",
  "timelinePosition": "9500 BCE",
  "content": "...",
  "summary": "...",
  "keyPeople": [],
  "keyPlaces": ["Lepenski Vir", "Dunav", "Đerdap"],
  "order": 1
}
```

Fields:

- id
- courseId
- periodId
- dayNumber
- title
- subtitle optional
- readingTimeMinutes — derived by the loader from the text (`max(1, ceil(words / 150))`), never authored (Phase 11)
- dateLabel optional
- timelinePosition optional
- content
- summary optional
- keyPeople optional
- keyPlaces optional
- order

### Runtime split (Phase 9, 2026-09-28)

The JSON file and the `Lesson` type stay the one contract. At runtime the generated registry splits each lesson on `LESSON_ARTICLE_KEYS` (`packages/content/src/types.ts`) into:

- `LessonSummary` — `id`, `courseId`, `sectionId`, `eraId`, `dayNumber`, `order`, `title`, `readingTimeMinutes`, `year`, `isPlaceholder`. The navigation index (sidebar, drawer, era accordion, timeline marker, resume rule, bookmarks list, counters); any surface may import it.
- `LessonArticle` — `content`, `sources`, `byline`, `lastReviewedAt`, `summary`, `keyPeople`, `keyPlaces`, `subtitle`, `dateLabel`, `timelinePosition`. Reachable only through `@learn365/content/server` (`getLessonArticle`), never from a client component.
- `LessonHeading` — the summary plus `subtitle` / `dateLabel`, for the open lesson's header.

Adding a field to a lesson means deciding which side it belongs to: anything only the open lesson (or the server) reads goes to the article, so the index stays small. `pnpm gen-content` writes both generated modules from one load.

## UserProgress

For v1, user progress can be stored locally.

Later it can be moved to backend persistence.

Example:

```json
{
  "courseId": "serbian-history-365",
  "completedLessonIds": [
    "day-001-lepenski-vir"
  ],
  "lastOpenedLessonId": "day-002-vinca-culture",
  "updatedAt": "2026-05-13T10:00:00Z"
}
```

Fields:

- courseId
- completedLessonIds
- lastOpenedLessonId
- updatedAt

## Lesson state

Lesson state is derived from progress.

Possible states:

```txt
completed
active
not_started
```

### completed

A lesson is completed if its id exists in `completedLessonIds`.

### active

A lesson is active if it is currently opened.

### not_started

A lesson is not started if it is not completed and not currently active.

## Course progress calculation

```txt
completedLessons = completedLessonIds.length
totalLessons = 365
percentage = completedLessons / totalLessons * 100
remainingLessons = totalLessons - completedLessons
```

Example:

```txt
1 / 365 completed
0.3%
364 remaining
```

## Period progress calculation

```txt
periodLessons = all lessons where periodId = current period
completedPeriodLessons = completed lessons inside this period
percentage = completedPeriodLessons / periodLessons.length * 100
```

Example:

```txt
Praistorija i antika
1 / 12 completed
```

## Initial course chapter structure

Suggested starting chapter structure:

```txt
1. Praistorija i antika
2. Doseljavanje Slovena i pokrštavanje
3. Rana srednjovekovna država
4. Nemanjići: uspon
5. Nemanjići: zenit i pad
6. Despoti i pad pod Osmanlije
7. Srbi pod Osmanlijama
8. Srbi pod Habzburškom monarhijom
9. Karađorđev i Milošev ustanak
10. Kneževina Srbija i izgradnja moderne države
11. Druga polovina 19. veka
12. Balkanski ratovi
13. Prvi svetski rat
14. Kraljevina SHS / Jugoslavija
15. Drugi svetski rat
16. Socijalistička Jugoslavija
17. Raspad Jugoslavije
18. Savremena Srbija
```

This structure can change after historical content planning.

## Content quality requirements

Lessons should be:

- historically accurate
- readable
- structured
- not too long
- not too academic
- not superficial
- neutral in tone
- suitable for broad audience
- written in clear Serbian

## Lesson content structure

Recommended lesson structure:

```txt
Title
Subtitle
Date / period
Short intro
Main explanation
Why it matters
Key facts
Short summary
```

Optional future additions:

- map
- image
- timeline detail
- quiz
- key terms
- related lessons
