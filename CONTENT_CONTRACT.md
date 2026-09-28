# Content Contract — History 365 / Istorija Srbije 365

This document is the **canonical contract** between the History 365 web app (`learn365/apps/web`) and any project that generates lesson content. The app is the source of truth; it expects content in exactly the shape described here.

The current course is:

- **Course id**: `istorija-srbije-365`
- **Total lessons**: 365
- **Language**: Serbian (Latin script)

The app reads content from plain JSON files at a fixed location. No database. No CMS. No admin import page.

---

## 1. Where the content goes

Drop your generated course at the repo root, in this exact layout:

```
content/
└─ courses/
   └─ istorija-srbije-365/
      ├─ course.json
      ├─ eras.json
      ├─ sections.json
      └─ lessons/
         ├─ day-001.json
         ├─ day-002.json
         ├─ day-003.json
         ├─ ...
         └─ day-365.json
```

Rules:

- One JSON file per lesson, named **`day-NNN.json`** where `NNN` is the day number, zero-padded to 3.
- The filename's day matches `dayNumber` and `id` inside the file.
- `course.json`, `eras.json`, `sections.json` are required at the course root.
- No other files in the directory. The loader walks `lessons/*.json` and ignores any non-JSON entries; do not place README or backup files there.

A working **example** lives at [content/courses/_example/](content/courses/_example/) — a 2-lesson mini-course that exercises every shape (authored + placeholder, with a single era and a single section). Use it as the canonical reference for field-by-field formatting.

---

## 2. Schemas

All shapes mirror the TypeScript types in [packages/content/src/types.ts](packages/content/src/types.ts). If this document and that file disagree, **the TypeScript file wins**.

### 2.1 `course.json` — one object

```json
{
  "id": "istorija-srbije-365",
  "title": "Istorija Srbije 365",
  "subtitle": "365 dana kroz istoriju Srbije",
  "description": "Strukturisan dnevni vodič kroz istoriju Srbije…",
  "totalLessons": 365,
  "language": "sr",
  "defaultScript": "latin",
  "coverImage": "optional/url-or-path"
}
```

| Field                       | Type                       | Required | Notes                                                   |
| --------------------------- | -------------------------- | -------- | ------------------------------------------------------- |
| `id`                        | string                     | yes      | Must equal the directory name.                          |
| `title`                     | string                     | yes      | Shown in the top bar, course page hero, breadcrumbs.    |
| `subtitle`                  | string                     | yes      | One-line tagline.                                       |
| `description`               | string                     | yes      | 1–3 sentences for the course overview.                  |
| `totalLessons`              | integer                    | yes      | Must equal the number of lesson files. For v1: `365`.   |
| `language`                  | `"sr"`                     | yes      | Only `"sr"` is supported in v1.                         |
| `defaultScript`             | `"latin"` \| `"cyrillic"`  | yes      | v1 ships Latin.                                         |
| `estimatedMinutesPerLesson` | —                          | **no — derived** | Not authored (Phase 11): the loader sets it to the median of the lessons' derived `readingTimeMinutes` and rejects the field when present. |
| `coverImage`                | string                     | no       | Reserved; not rendered today.                           |

### 2.2 `eras.json` — array of Era objects

Eras are the chronological bands shown on the historical timeline. They drive the timeline; sections drive the sidebar.

```json
[
  {
    "id": "nemanjici",
    "courseId": "istorija-srbije-365",
    "num": "II",
    "title": "Nemanjićka Srbija",
    "description": "Od Stefana Nemanje i Svetog Save do carstva Dušana Silnog…",
    "yearStart": 1166,
    "yearEnd": 1371,
    "yearsLabel": "1166–1371",
    "eraShort": "Nemanjići",
    "order": 2
  }
]
```

| Field         | Type    | Required | Notes                                                                       |
| ------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `id`          | string  | yes      | Stable slug, kebab-case. Referenced by sections + lessons.                  |
| `courseId`    | string  | yes      | Must match `course.id`.                                                     |
| `num`         | string  | yes      | Roman numeral for display (e.g. `"II"`).                                    |
| `title`       | string  | yes      | Full era name shown on the home page + timeline.                            |
| `description` | string  | yes      | 1–2 sentences shown under the era title.                                    |
| `yearStart`   | integer | yes      | Negative = BCE (e.g. `-9500`). Inclusive bound.                             |
| `yearEnd`     | integer | yes      | Inclusive bound. `yearStart <= yearEnd`.                                    |
| `yearsLabel`  | string  | yes      | Display string (e.g. `"1166–1371"`, `"praistorija – 1166"`).                |
| `eraShort`    | string  | yes      | Short tag for compact contexts (timeline, chips).                           |
| `order`       | integer | yes      | 1-indexed. Must be sequential `1..N` across the eras array (no gaps).       |

### 2.3 `sections.json` — array of Section objects

Sections are the sidebar accordion units. Each section sits inside one era and covers a contiguous day range.

```json
[
  {
    "id": "rani-nemanjici",
    "courseId": "istorija-srbije-365",
    "eraId": "nemanjici",
    "title": "Rani Nemanjići",
    "subtitle": "Od Stefana Nemanje do Stefana Prvovenčanog",
    "order": 4,
    "startDay": 31,
    "endDay": 45
  }
]
```

| Field      | Type    | Required | Notes                                                                      |
| ---------- | ------- | -------- | -------------------------------------------------------------------------- |
| `id`       | string  | yes      | Stable slug. Referenced by lessons.                                        |
| `courseId` | string  | yes      | Must match `course.id`.                                                    |
| `eraId`    | string  | yes      | Must exist in `eras.json`.                                                 |
| `title`    | string  | yes      | Shown as the accordion header.                                             |
| `subtitle` | string  | no       | One-line context under the title.                                          |
| `order`    | integer | yes      | 1-indexed. Must be sequential `1..N` across all sections.                  |
| `startDay` | integer | yes      | Day number of the first lesson in this section.                            |
| `endDay`   | integer | yes      | Day number of the last lesson. `startDay <= endDay`.                       |

**Contiguity rule**: section `[startDay..endDay]` ranges must be contiguous and cover days `1..totalLessons` exactly. Sorted by `order`, the next section's `startDay` is the previous section's `endDay + 1`.

### 2.4 `lessons/day-NNN.json` — one Lesson object per file

```json
{
  "id": "day-031",
  "courseId": "istorija-srbije-365",
  "sectionId": "rani-nemanjici",
  "eraId": "nemanjici",
  "dayNumber": 31,
  "order": 1,
  "title": "Stefan Nemanja preuzima vlast",
  "subtitle": "Sabor velikaša u Rasu i tihi početak nove ere",
  "year": 1166,
  "dateLabel": "1166.",
  "timelinePosition": "1166",
  "summary": "Saborski preokret kojim Stefan Nemanja preuzima vlast…",
  "keyPeople": ["Stefan Nemanja", "Tihomir"],
  "keyPlaces": ["Ras", "Studenica"],
  "content": [
    { "type": "paragraph", "dropcap": true, "text": "Poslednje godine dvanaestog veka…" },
    { "type": "paragraph", "text": "Stefan Nemanja je u to vreme već bio iskusan vladar…" },
    { "type": "heading", "level": 2, "text": "Šta je značio sabor iz 1166." },
    { "type": "paragraph", "text": "Sabor velikaša u Rasu nije bio samo formalnost…" },
    { "type": "quote", "text": "Zakonom valja vladati, a ne silom…", "attribution": "pripisano sv. Savi" }
  ],
  "isPlaceholder": false
}
```

| Field                | Type                     | Required | Notes                                                                                 |
| -------------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `id`                 | string                   | yes      | `day-NNN` matching the filename and `dayNumber`. Unique within the course.            |
| `courseId`           | string                   | yes      | Must match `course.id`.                                                               |
| `sectionId`          | string                   | yes      | Must exist in `sections.json`. `dayNumber` must fall inside that section's range.     |
| `eraId`              | string                   | yes      | Must equal the section's `eraId`.                                                     |
| `dayNumber`          | integer                  | yes      | `1..totalLessons`. Unique. Determines lesson order in the reader and URL.             |
| `order`              | integer                  | yes      | 1-indexed position within the parent section.                                         |
| `title`              | string                   | yes      | ≤ 70 characters. Shown as `<h1>` in the reader.                                       |
| `subtitle`           | string                   | no       | ≤ 120 characters. One-line lede under the title.                                      |
| `readingTimeMinutes` | —                        | **no — derived** | Not authored (Phase 11): `max(1, ceil(words / 150))` over the paragraph / heading / quote text, computed by the loader, which rejects the field when present. Shown in the lesson eyebrow; authored lessons must land in `4..15`. |
| `year`               | integer                  | yes      | Must fall inside the era's `[yearStart..yearEnd]`. Negative = BCE.                    |
| `dateLabel`          | string                   | no       | Display label for the date/period (e.g. `"1166."`, `"oko 9500–6000. p.n.e."`).        |
| `timelinePosition`   | string                   | no       | Compact label for the timeline pin (e.g. `"9500 BCE"`).                               |
| `summary`            | string                   | no       | 1–2 sentence standalone summary (reserved for future surfaces).                       |
| `keyPeople`          | string[]                 | no       | Empty array allowed; omit for lessons where it doesn't apply.                         |
| `keyPlaces`          | string[]                 | no       | Same.                                                                                 |
| `content`            | LessonBlock[]            | yes      | Non-empty array. See §2.5.                                                            |
| `isPlaceholder`      | boolean                  | no       | `true` only for stub lessons; see §3.                                                 |

### 2.5 `LessonBlock` discriminated union

```ts
type LessonBlock =
  | { type: "paragraph"; text: string; dropcap?: boolean }
  | { type: "heading";   level: 2 | 3; text: string }
  | { type: "quote";     text: string; attribution?: string }
  | { type: "image";     src: string; alt: string; caption?: string };
```

Rules:

- **No HTML or Markdown** inside `text`. Plain Serbian text only. The renderer does not parse markup. Em dashes (`—`), curly quotes, and Unicode are fine.
- **No links** inside `text` in v1. Link blocks are deferred.
- The **first block of every authored lesson** must be a `paragraph` with `dropcap: true`. The reader renders the first letter as a drop cap.
- `heading.level` is `2` (largest in-body heading) or `3` (sub-points). Use `2` sparingly — typically 1–3 per lesson.
- `quote.attribution` is optional but strongly recommended for primary-source quotations.
- `image` is rendered as a captioned placeholder in v1 (no real `<img>` yet). `alt` is mandatory and must be meaningful — not "image of …".

### 2.6 Body length

Each authored lesson body should be **700–1100 words** (≈ 7–10 minutes of reading). The validator does not enforce word count; the editorial review does.

---

## 3. Placeholder lessons

The app needs all 365 records present from day one — sidebar, timeline, progress counter, and URLs depend on it. Lessons that have not yet been authored ship as **placeholders**:

```json
{
  "id": "day-042",
  "courseId": "istorija-srbije-365",
  "sectionId": "...",
  "eraId": "...",
  "dayNumber": 42,
  "order": 12,
  "title": "Marička bitka",
  "year": 1371,
  "isPlaceholder": true,
  "content": [
    { "type": "paragraph", "text": "Lekcija se uskoro objavljuje." }
  ]
}
```

Hard rules for placeholders:

- `isPlaceholder: true`.
- `content` is exactly one `paragraph` block with text `"Lekcija se uskoro objavljuje."` — character-exact.
- No `dropcap`, no other blocks.
- Title, `dayNumber`, `sectionId`, `eraId`, `year` must still be valid — the lesson appears in the sidebar and timeline like any other. (`readingTimeMinutes` derives to 1 for the stub body; the `4..15` band is not applied to placeholders.)

The reader detects `isPlaceholder` and shows an "Uskoro" notice instead of the body; the "Mark as completed" button is hidden.

---

## 4. Stable IDs and URLs

- **Lesson ID format**: `day-NNN` (zero-padded). Stable across content revisions — never reuse a day number for a different topic.
- **Lesson URL**: `/course/istorija-srbije-365/lesson/day-NNN`. Bookmarkable.
- **Section / era IDs**: kebab-case slugs. Stable. If you rename a section, you also rename every lesson's `sectionId`.
- **Local progress** is keyed by lesson ID in `localStorage`. Changing a lesson ID drops that user's completion mark for that lesson.

---

## 5. Validation

Run the validator before shipping any content batch:

```sh
pnpm --filter @learn365/content validate-files
```

By default it validates `content/courses/istorija-srbije-365/`. Pass a path to point at any other directory:

```sh
pnpm --filter @learn365/content validate-files content/courses/_example
```

The validator checks:

1. `course.json`, `eras.json`, `sections.json` exist and parse as valid JSON.
2. Every JSON file matches the schema in §2 (required fields, types, enum values).
3. `lessons/` contains exactly `course.totalLessons` `*.json` files.
4. Lesson `dayNumber` values cover `1..totalLessons` with no duplicates and no gaps.
5. Lesson IDs are unique.
6. Every `courseId` field matches `course.id`.
7. Every lesson's `sectionId` resolves to a section, and `dayNumber` is inside that section's `[startDay..endDay]`.
8. Every lesson's `eraId` matches its section's `eraId`.
9. Every lesson's `year` falls inside its era's `[yearStart..yearEnd]`.
10. Section day ranges are contiguous and cover `1..totalLessons` exactly.
11. Era `order` and Section `order` are sequential starting at 1.
12. Era year ranges are monotonic (non-decreasing `yearStart` by `order`).
13. The derived `readingTimeMinutes` is in `[4..15]` for every authored lesson (the field itself must not appear in the JSON — the loader rejects it).
14. `title.length <= 70`, `subtitle.length <= 120`.
15. Each lesson has at least one content block.
16. Placeholders are marked correctly: `isPlaceholder: true` ↔ body is exactly the placeholder paragraph.
17. Authored lessons (`isPlaceholder !== true`) start with `{ type: 'paragraph', dropcap: true, … }`.

Exit codes: `0` clean, `1` validation problems, `2` malformed JSON / missing files.

---

## 6. Generating the content

The content-generation project's job is to produce, for `istorija-srbije-365`:

- 1 `course.json`
- 1 `eras.json` containing the chosen historical eras (8 is the current editorial structure but the contract does not require that exact count)
- 1 `sections.json` containing 25–40 sections that partition days `1..365` contiguously
- 365 lesson files under `lessons/`

Recommended generation order:

1. Decide the era structure → write `eras.json`.
2. Decide the section structure (titles + day ranges) → write `sections.json`.
3. Compute `dayNumber → { sectionId, eraId, year }` once.
4. For each day `1..365`, emit `lessons/day-NNN.json`. Lessons you have not yet written are emitted as placeholders (§3).
5. Replace placeholders with authored bodies as content lands.
6. Run the validator after every batch.

A working example covering steps 1–4 is at [content/courses/_example/](content/courses/_example/).

---

## 7. After dropping the content

Once `content/courses/istorija-srbije-365/` is populated and the validator exits 0, switch the app's registry to read from it. The wiring change is one edit:

- Open [packages/content/src/courses/istorija-srbije-365/index.ts](packages/content/src/courses/istorija-srbije-365/index.ts).
- Replace the four TypeScript imports (`course`, `eras`, `sections`, `lessons`) with a single call to `loadCourseFromFiles(<absolute path to content/courses/istorija-srbije-365>)` and re-export `course / eras / sections / lessons` from the returned object.

After the switch, the existing TypeScript modules (`course.ts`, `eras.ts`, `sections.ts`, `lessons/`) and the seed authored files can be deleted. The registry, the UI, and progress storage continue to work unchanged because the loader returns the same shapes the registry already consumes.

---

## 8. What this contract does not cover

- **Translations**. The current contract is single-language Serbian Latin. A future revision will add a `language` segment to the directory layout.
- **Images**. The renderer treats `image` blocks as captioned placeholders. Real image hosting and an asset pipeline are out of scope for v1.
- **Links inside body text**. Not supported in v1; deferred to a future block type.
- **Quizzes, footnotes, key-term glossaries**. Out of scope for v1.
- **Backend persistence**. There is no upload endpoint. Content is read from the filesystem at build time.

---

## 9. Quick checklist for each lesson

- [ ] File is `lessons/day-NNN.json` and `NNN` matches the filename, `id`, and `dayNumber`.
- [ ] `courseId`, `sectionId`, `eraId` resolve and agree with each other.
- [ ] `year` is inside the era's year range.
- [ ] `title` ≤ 70 chars.
- [ ] No `readingTimeMinutes` in the file — the loader derives it from the text (at 150 wpm, 700–1100 words read as 5–8 minutes).
- [ ] If authored: first block is `paragraph` with `dropcap: true`; body is 700–1100 words.
- [ ] If placeholder: `isPlaceholder: true` and body is exactly the placeholder paragraph.
- [ ] `pnpm --filter @learn365/content validate-files` exits 0.
