# Content Authoring

> **Schema source of truth:** [`CONTENT_MODEL.md`](./CONTENT_MODEL.md) and `packages/content/src/types.ts`. This document covers the _mechanics_ of writing and shipping content for the first course (`istorija-srbije-365`): the JSON files, the validator, the codegen step, the checklist.

---

## 1. Core rule

**Content lives in JSON files under `content/`, never inside React components.** Lesson bodies are structured `LessonBlock[]` arrays; components render the blocks and contain no text of their own. This is what lets the same lessons render on web today and on a native app later, and what lets the source format change without touching UI code.

---

## 2. Where the files are

```
content/courses/istorija-srbije-365/
├─ course.json                 # one Course record
├─ eras.json                   # 8 Era records
├─ sections.json               # 37 Section records
└─ lessons/
   ├─ day-001.json             # one Lesson per file, 365 files
   ├─ day-002.json
   └─ …
```

The loader (`packages/content/src/loader/loadCourseFromFiles.ts`) reads these once; nothing at runtime touches the file system. Two generated modules under `packages/content/src/courses/istorija-srbije-365/` make the content visible to the bundler — see §4.

---

## 3. A lesson file (illustrative values)

```json
{
  "id": "day-046",
  "courseId": "istorija-srbije-365",
  "sectionId": "nemanjici-rani",
  "eraId": "nemanjici",
  "dayNumber": 46,
  "order": 1,
  "title": "Stefan Nemanja preuzima vlast",
  "subtitle": "Sabor velikaša u Rasu i tihi početak nove ere",
  "year": 1166,
  "dateLabel": "1166.",
  "timelinePosition": "1166",
  "summary": "Saborski preokret kojim Stefan Nemanja preuzima vlast nad Raškom i postavlja temelj nemanjićke države.",
  "keyPeople": ["Stefan Nemanja", "Tihomir"],
  "keyPlaces": ["Ras", "Studenica"],
  "content": [
    { "type": "paragraph", "dropcap": true, "text": "Poslednje godine dvanaestog veka …" },
    { "type": "paragraph", "text": "Stefan Nemanja je u to vreme …" },
    { "type": "heading", "level": 2, "text": "Šta je značio sabor iz 1166." },
    { "type": "paragraph", "text": "Sabor velikaša u Rasu nije bio samo formalnost …" },
    { "type": "quote", "text": "…", "attribution": "Studenička povelja" },
    { "type": "paragraph", "text": "…" }
  ],
  "isPlaceholder": false,
  "lastReviewedAt": "2026-05-19",
  "sources": [
    {
      "kind": "book",
      "title": "Istorija srpskog naroda I",
      "author": "Sima Ćirković (ur.)",
      "year": 1981
    },
    {
      "kind": "web",
      "title": "Studenica — UNESCO World Heritage",
      "url": "https://whc.unesco.org/en/list/389/",
      "year": 2026
    }
  ]
}
```

### Rules the validator enforces

- `id` is `day-NNN` (three digits) and equals the file name; `dayNumber` matches it, is unique, and the corpus covers 1..`totalLessons` with no gaps.
- `courseId`, `eraId`, `sectionId` reference existing records; the lesson's era is its section's era; sections are contiguous day ranges in `order`; eras are in `order` with `yearStart ≤ yearEnd`.
- At least one content block; an authored lesson's first block is a `paragraph` with `dropcap: true`; a body that is only the placeholder sentence must set `isPlaceholder: true`.
- `image` blocks carry `width`, `height` and a non-empty `alt`.
- House-style wording (`src/loader/wordingChecks.ts`) on every reader-visible string (title, subtitle, summary, date labels, key people / places, block text, alt, caption): no “ (close „…” with ”), no ASCII `"`, no number-period-letter run without a space („1878.Pravac”), no Turkish letters ğ / ı / ş (write Pazvan-Oglu, Nizam-i, Huršid-paša); `summary` ≤ 160 characters; a `dateLabel` must contain a digit (a year, range or century — not „pregled”).
- **No `readingTimeMinutes` on a lesson and no `estimatedMinutesPerLesson` on the course** — both are derived by the loader (Phase 11: `max(1, ceil(words / 150))` per lesson; the median for the course) and rejected when present. The copy's promise (`5–7 minuta`) is computed from the corpus, so a lesson far outside 700–1100 words moves the promise.

### Block types

```ts
type LessonBlock =
  | { type: 'paragraph'; text: string; dropcap?: boolean }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'image'; src: string; alt: string; width: number; height: number; caption?: string };
```

- `heading` level 2 is the largest in-body heading; level 3 is for sub-points. Most lessons need 0–2 headings.
- `quote` is for short, attributed primary-source quotations.
- `image` is used only on the 8 era-opener lessons (Days 1, 46, 106, 151, 196, 231, 281, 341), at `content[1]`, with a Wikimedia Commons asset under `apps/web/public/lessons/era-N-<slug>.webp` and the attribution inside `caption`. Other lessons stay imageless by design.
- No HTML and no links inside `text`.

### Trust fields

`sources[]` (book / article / museum / archive / web), `lastReviewedAt` (ISO date) and `byline { author?, reviewer? }` render after the body as _Izvori_ and the trust line. A byline names a real person per lesson; there is no generic fallback, so leave it out rather than invent one.

---

## 4. Pipeline: validate, generate, commit

```bash
pnpm validate-content     # the checks above; exits 1 with a list of failures
pnpm gen-content          # writes packages/content/src/courses/istorija-srbije-365/_generated.ts
                          #   (course, eras, sections, lesson summaries — the client index)
                          # and _generated.articles.ts (bodies, sources, bylines — server only)
```

Both generated files are committed. **CI fails when they differ from what `pnpm gen-content` produces** (the drift check runs before the build), so every content edit is: edit JSON → `pnpm validate-content` → `pnpm gen-content` → commit all three. The app never reads JSON at runtime; forgetting the codegen step ships stale content locally.

Why two generated files: the client bundle carries only the navigation index (~9 kB gzip for 365 lessons); the bodies (~800 kB gzip) are rendered by the server page (Phase 9). The split is declared once, as `LESSON_ARTICLE_KEYS` in `packages/content/src/types.ts`.

---

## 5. Eras and sections

```json
// eras.json (one of 8)
{
  "id": "nemanjici", "courseId": "istorija-srbije-365", "num": "II",
  "title": "Nemanjićka Srbija", "eraShort": "Nemanjići",
  "description": "Uspon i vrhunac srednjovekovne srpske države …",
  "yearStart": 1166, "yearEnd": 1371, "yearsLabel": "1166–1371.", "order": 2
}

// sections.json (one of 37; illustrative values)
{
  "id": "nemanjici-rani", "courseId": "istorija-srbije-365", "eraId": "nemanjici",
  "title": "Rani Nemanjići", "subtitle": "Od Stefana Nemanje do Stefana Prvovenčanog",
  "order": 6, "startDay": 46, "endDay": 60
}
```

`eraShort` must fit a timeline band (≤ 22 characters, no word longer than "Despotovina"). Moving a lesson between sections means updating both sections' day ranges and the lesson's `sectionId` / `eraId` / `order`; the validator catches anything left inconsistent.

---

## 6. Tone and style

- Serbian, Latin script; not stilted academic register, not tabloid casual. Ekavian standard — the corpus still carries a few Croatian-standard residues (`tisuću`, `stoljeće`) listed in the 2026-09-28 review, item 24; fix them when you touch a lesson.
- Spelling: Habzburšk- (not Habsburšk-); Austro-Ugarska for the state, austrougarski for the adjective; Kneginja.
- Neutral, non-ideological framing; no romanticising, no polemics, no anachronistic moralising.
- One clear arc per lesson: setup → core → significance. 700–1100 words. Vary the shape: not every lesson needs a heading, some deserve a quotation.
- Gender-neutral address to the reader in UI copy (the lessons themselves are third person).

---

## 7. Future path — Markdown / MDX

The loader is the seam: `loadCourseFromFiles` returns the same `Course` / `Era[]` / `Section[]` / `Lesson[]` whatever the source format, and everything downstream (validator, codegen, registry, components) is unchanged. A Markdown source would add a parser (frontmatter → the metadata fields, body → `LessonBlock[]`) in front of the same validator. Trigger for doing it: a non-engineer editor contributing regularly, or a need for footnotes / rich inline formatting the block union does not cover. Until then JSON is explicit, diffable and validated.

---

## 8. Localization (future)

Not implemented. `Course.language` exists; a second language would be a second course directory (`content/courses/<course-id>/`), not parallel files inside this one.

---

## 9. Checklist for one lesson

- [ ] File is `lessons/day-NNN.json`; `id` and `dayNumber` match it.
- [ ] `sectionId` and `eraId` match the section record; `order` is right within the section.
- [ ] `year` sits inside the era's range and does not run backwards against its neighbours.
- [ ] First block is a `paragraph` with `dropcap: true`; 700–1100 words; no HTML, no links in `text`.
- [ ] `summary` is one standalone sentence under ~160 characters.
- [ ] `keyPeople` / `keyPlaces` are filled where historically relevant.
- [ ] `sources[]` cover the checkable claims; `lastReviewedAt` set when a fact check was done; no invented `byline`.
- [ ] No `readingTimeMinutes` in the file.
- [ ] `pnpm validate-content` exits 0; `pnpm gen-content` run and both generated files committed.
- [ ] Read once more as the Historical Content Editor (tone, accuracy, chronology).
