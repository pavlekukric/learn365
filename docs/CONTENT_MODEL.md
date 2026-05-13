# Content Model

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
  "defaultScript": "latin",
  "estimatedMinutesPerLesson": 10
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
- estimatedMinutesPerLesson
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
  "readingTimeMinutes": 8,
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
- readingTimeMinutes
- dateLabel optional
- timelinePosition optional
- content
- summary optional
- keyPeople optional
- keyPlaces optional
- order

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
