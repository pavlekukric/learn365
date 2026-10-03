# Content Model

> **Canonical content contract.** This document defines the entity shapes (`Course`, `Era`, `Section`, `Lesson`, `LessonBlock`, `Source`, `UserProgress`) the app is built on. The TypeScript source of these shapes is [`packages/content/src/types.ts`](../packages/content/src/types.ts); when the two disagree, the types win and this file is corrected. For the mechanics of writing and shipping a lesson (files, validator, codegen), see [`CONTENT_AUTHORING.md`](./CONTENT_AUTHORING.md). The repo-root [`CONTENT_CONTRACT.md`](../CONTENT_CONTRACT.md) is only a pointer here.

## Overview

One course, `istorija-srbije-365` (_Istorija Srbije 365_), with 365 lessons — one per day — grouped in two ways:

- **8 eras** (`Era`) drive the historical timeline on Home and the lesson page and the era cards on the course overview.
- **37 sections** (`Section`) drive the sidebar / drawer accordion inside each era.

The hierarchy is `Course → Era → Section → Lesson`. The editable source is JSON under [`content/courses/istorija-srbije-365/`](../content/courses/istorija-srbije-365/) (`course.json`, `eras.json`, `sections.json`, `lessons/day-001.json … day-365.json`). All 365 lessons are authored; there are no placeholders in the current corpus.

## Course

```json
{
  "id": "istorija-srbije-365",
  "title": "Istorija Srbije 365",
  "subtitle": "365 dana kroz istoriju Srbije",
  "description": "Strukturisan dnevni vodič kroz istoriju Srbije: …",
  "totalLessons": 365,
  "language": "sr",
  "defaultScript": "latin"
}
```

| Field                                    | Notes                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `title`, `subtitle`, `description` | `description` is the factual lede shared by Home metadata and the course overview.                                               |
| `totalLessons`                           | Must equal the number of lesson files (365).                                                                                     |
| `language`, `defaultScript`              | `'sr'`, `'latin'`. Cyrillic is a future option, not implemented.                                                                 |
| `estimatedMinutesPerLesson`              | **Derived by the loader** (Phase 11): the median of the lessons' reading minutes. Never written in JSON — the loader rejects it. |
| `coverImage`                             | Optional, unused today.                                                                                                          |

## Era

```json
{
  "id": "nemanjici",
  "courseId": "istorija-srbije-365",
  "num": "II",
  "title": "Nemanjićka Srbija",
  "description": "Uspon i vrhunac srednjovekovne srpske države …",
  "yearStart": 1166,
  "yearEnd": 1371,
  "yearsLabel": "1166–1371.",
  "eraShort": "Nemanjići",
  "order": 2
}
```

| Field                                | Notes                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `num`                                | Roman numeral shown as `EPOHA II`.                                                                          |
| `title` / `eraShort`                 | Full title on cards and mobile rows; `eraShort` (≤ 22 chars) on the desktop timeline bands and in eyebrows. |
| `description`                        | 1–2 editorial sentences, always visible on the era card.                                                    |
| `yearStart`, `yearEnd`, `yearsLabel` | Numbers drive the timeline maths (BCE is negative: `-9500`); the label is what the reader sees.             |
| `order`                              | 1..8, contiguous.                                                                                           |

## Section

```json
{
  "id": "praistorija-podunavlja",
  "courseId": "istorija-srbije-365",
  "eraId": "praistorija-i-antika",
  "title": "Praistorija Podunavlja",
  "subtitle": "Lepenski Vir, starčevačka i vinčanska kultura",
  "order": 1,
  "startDay": 1,
  "endDay": 7
}
```

Sections are contiguous, non-overlapping day ranges (`startDay..endDay`, 4–18 lessons each) and belong to exactly one era. `order` is the position within the course.

## Lesson

```json
{
  "id": "day-001",
  "courseId": "istorija-srbije-365",
  "sectionId": "praistorija-podunavlja",
  "eraId": "praistorija-i-antika",
  "dayNumber": 1,
  "order": 1,
  "title": "Lepenski Vir — naselje na Dunavu",
  "subtitle": "Otkriće jednog od najstarijih organizovanih naselja u Evropi",
  "year": -9500,
  "dateLabel": "oko 9500–6000. p. n. e.",
  "timelinePosition": "~9500–6000. p. n. e.",
  "summary": "Trapezaste kuće sa glačanim podovima …",
  "keyPeople": ["Dragoslav Srejović"],
  "keyPlaces": ["Lepenski Vir", "Đerdap", "Dunav"],
  "content": [
    { "type": "paragraph", "dropcap": true, "text": "U Đerdapskoj klisuri, …" },
    {
      "type": "image",
      "src": "/lessons/era-1-lepenski-vir.webp",
      "alt": "…",
      "width": 1440,
      "height": 1080,
      "caption": "… Wikimedia Commons."
    },
    { "type": "paragraph", "text": "…" }
  ],
  "isPlaceholder": false,
  "sources": [
    {
      "kind": "book",
      "title": "Lepenski Vir: nova praistorijska kultura u Podunavlju",
      "author": "Dragoslav Srejović",
      "year": 1969
    },
    { "kind": "museum", "title": "Muzej Lepenski Vir, Donji Milanovac" }
  ]
}
```

| Field                            | Notes                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                             | `day-NNN`, zero-padded to three digits; equals the file name.                                                                                                                                                                                                                                                                                                                                   |
| `courseId`, `eraId`, `sectionId` | Must reference existing records; the lesson's era must be its section's era.                                                                                                                                                                                                                                                                                                                    |
| `dayNumber`                      | 1..365, unique, no gaps across the corpus.                                                                                                                                                                                                                                                                                                                                                      |
| `order`                          | Position within the section, 1-indexed.                                                                                                                                                                                                                                                                                                                                                         |
| `title`, `subtitle`              | `subtitle` optional, shown under the title in the lesson header.                                                                                                                                                                                                                                                                                                                                |
| `year`                           | The representative year for the timeline marker (BCE negative). Should not run backwards inside an era (25 backward steps remain; the validator does not enforce it).                                                                                                                                                                                                                           |
| `dateLabel`, `timelinePosition`  | Display strings; optional.                                                                                                                                                                                                                                                                                                                                                                      |
| `readingTimeMinutes`             | **Derived by the loader** (Phase 11): `max(1, ceil(words / 150))` over paragraph, heading and quote text. Never written in JSON — the loader rejects it.                                                                                                                                                                                                                                        |
| `content`                        | `LessonBlock[]`, at least one block; the first block of an authored lesson is a paragraph with `dropcap: true`.                                                                                                                                                                                                                                                                                 |
| `isPlaceholder`                  | `false` on every lesson today. `true` would render the calm "Uskoro" state and disable completion; the field stays for any future re-introduction.                                                                                                                                                                                                                                              |
| `summary`                        | One standalone sentence; feeds the share-preview description (keep it under ~160 characters).                                                                                                                                                                                                                                                                                                   |
| `keyPeople`, `keyPlaces`         | Optional lists (`keyPeople` is empty on 64 lessons); not rendered in the reader yet.                                                                                                                                                                                                                                                                                                            |
| `byline`                         | `{ author?, reviewer? }`. Rendered in `LessonTrustLine` after the sources (mono line above the course-wide check note); absent on every lesson today — each name is authored explicitly, there is no course-wide fallback.                                                                                                                                                                      |
| `lastReviewedAt`                 | ISO date of a **named** reviewer's fact check; the loader rejects it without `byline.reviewer`. Absent on every lesson today: the six 2026-05-19 dates were dropped (review 2026-10-03 P1 4) because no named person stood behind them. The machine-assisted passes of Sept–Oct 2026 are not recorded here — the trust line under every lesson states them and links `/course/<id>/literatura`. |
| `sources`                        | `Source[]`; rendered as the closing _Izvori_ block when present.                                                                                                                                                                                                                                                                                                                                |

### `LessonBlock`

```ts
type LessonBlock =
  | { type: 'paragraph'; text: string; dropcap?: boolean }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'image'; src: string; alt: string; width: number; height: number; caption?: string };
```

- Exactly one `dropcap: true`, on the first block.
- `image` needs the intrinsic `width` / `height` (it renders through `next/image`), a meaningful `alt`, and carries its attribution inside `caption` (no separate field). Today only the 8 era-opener lessons carry an image, at `content[1]`; assets live in `apps/web/public/lessons/`.
- No HTML, no links inside `text`.

### `Source`

```ts
type Source = {
  kind: 'book' | 'article' | 'museum' | 'archive' | 'web';
  title: string;
  author?: string;
  year?: number; // published (book, article) or accessed (web)
  url?: string; // absolute; must parse with new URL()
};
```

### Runtime split (Phase 9)

The JSON file and the `Lesson` type stay the one contract. At runtime the generated registry splits each lesson on `LESSON_ARTICLE_KEYS` (`packages/content/src/types.ts`) into:

- `LessonSummary` — `id`, `courseId`, `sectionId`, `eraId`, `dayNumber`, `order`, `title`, `readingTimeMinutes`, `year`, `isPlaceholder`. The navigation index (sidebar, drawer, era accordion, timeline marker, resume rule, bookmarks list, counters); any surface may import it (~9 kB gzip).
- `LessonArticle` — `content`, `sources`, `byline`, `lastReviewedAt`, `summary`, `keyPeople`, `keyPlaces`, `subtitle`, `dateLabel`, `timelinePosition`. Reachable only through `@learn365/content/server` (`getLessonArticle`), never from a client component (~800 kB gzip).
- `LessonHeading` — the summary plus `subtitle` / `dateLabel`, for the open lesson's header.

Adding a field to a lesson means deciding which side it belongs to: anything only the open lesson (or the server) reads goes to the article, so the index stays small. `pnpm gen-content` writes both generated modules from one load.

## UserProgress

```json
{
  "courseId": "istorija-srbije-365",
  "completedLessonIds": ["day-001"],
  "lastOpenedLessonId": "day-002",
  "updatedAt": "2026-05-13T10:00:00Z"
}
```

Kept per course in the browser (`localStorage`, key `learn365:progress:v1`) by the `@learn365/core` progress store. Since Phase 8 a signed-in reader's progress is also held on the account (`/api/me/progress`) and synced by the browser: a one-time union on first contact, server-authoritative loads afterwards, coalesced deltas for changes. Reading never requires an account. **Bookmarks** (`learn365:bookmarks:v1`, `/api/me/bookmarks`) follow the same shape and the same sync.

## Lesson state

Derived from progress, never stored: `completed` (id in `completedLessonIds`), `active` (the open lesson), `not_started`.

## Progress arithmetic

```txt
completed  = completedLessonIds.length
total      = course.totalLessons (365)
remaining  = total - completed
```

The product shows counts, not percentages (`Pročitano 1 / 365`, `1 od 365` in the ring) so the first win never rounds to `0%`. Per-era and per-section counts filter the lessons by `eraId` / `sectionId` and count the completed ones.

## Resume rule

Every "start / continue" surface (Home hero, Home card, daily anchor, course overview card) resolves the same lesson through `findResumeLesson` in `@learn365/core`: Day 1 until something is completed; then the lesson left unfinished, else the first unread day; `null` when all 365 are read. "Tvoj N. dan" is that lesson's day.

## Content quality requirements

Lessons are: historically accurate; readable; structured (one clear arc: setup → core → significance); 5–7 minutes long (≈ 700–1100 words); not academic, not superficial; neutral in tone; written in clear Serbian (Latin script). Every historical claim that a reader might check should have a source in `sources`.

## Lesson body shape

```txt
Title (+ optional subtitle, date label)
Opening paragraph (dropcap)
[era-opener image]
Main explanation, optionally with 1–2 headings and a quotation
Why it matters
Sources
```

Future additions under consideration: a "Ličnosti · Mesta" line from `keyPeople` / `keyPlaces`, related lessons, maps. Quizzes and streaks are out of scope for v1.

## Validator rules not restated above

Carried over from the old root `CONTENT_CONTRACT.md` (2026-10-03); `packages/content/src/loader/validateContentFiles.ts` is the source of truth.

1. Lesson `title` ≤ 70 characters, `subtitle` ≤ 120.
2. The derived reading time of an authored lesson is 4–15 minutes.
3. A placeholder's body is exactly `Lekcija se uskoro objavljuje.`
4. A lesson's `year` falls inside its era's range; era `yearStart` never decreases by `order`; era and section `order` run from 1 with no gaps.
5. The validator takes the course directory as an argument and exits 0 (clean), 1 (problems) or 2 (malformed JSON or missing files).
6. Lesson ids are permanent: progress and bookmarks are keyed by them.
