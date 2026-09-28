# Content Authoring

> **Schema source of truth:** [`CONTENT_MODEL.md`](./CONTENT_MODEL.md). This document covers the *mechanics* of writing and shipping content for the first course (`istorija-srbije-365`) — file layout, validator, MDX migration path. Tone and historical-accuracy expectations come from `CONTENT_MODEL.md`.

---

## 1. Core rule

**Content lives in `packages/content` and is never written inside React components.** Lesson bodies are structured `LessonBlock[]` arrays. Components render the blocks; they do not contain the text.

This separation is what lets the same lessons render unchanged on web today and on mobile later, and what lets us migrate to MDX/Markdown without touching UI code.

---

## 2. v1 authoring format — TypeScript modules

For v1, each lesson is a TypeScript file under:

```
packages/content/src/courses/istorija-srbije-365/lessons/<lesson-id>.ts
```

Each file default-exports a `Lesson` record.

### Template

```ts
import type { Lesson } from '@learn365/content/types';

const lesson: Lesson = {
  id: 'nemanjici-rani-001',
  courseId: 'istorija-srbije-365',
  eraId: 'nemanjici',
  sectionId: 'nemanjici-rani',
  dayNumber: 31,
  order: 1,
  title: 'Stefan Nemanja preuzima vlast',
  subtitle: 'Sabor velikaša u Rasu i tihi početak nove ere',
  // readingTimeMinutes is derived from the text by the loader (Phase 11) — never written by hand
  year: 1166,
  dateLabel: '1166.',
  timelinePosition: '1166',
  keyPeople: ['Stefan Nemanja', 'Tihomir'],
  keyPlaces: ['Ras', 'Studenica'],
  summary:
    'Saborski preokret kojim Stefan Nemanja preuzima vlast nad Raškom i postavlja temelj nemanjićke države.',
  content: [
    { type: 'paragraph', dropcap: true, text:
      'Poslednje godine dvanaestog veka zatekle su Rasku u trenutku kada je samo jasna ruka mogla da je ujedini…' },
    { type: 'paragraph', text:
      'Stefan Nemanja je u to vreme već bio iskusan vladar mlađe braće…' },
    { type: 'heading', level: 2, text: 'Šta je značio sabor iz 1166.' },
    { type: 'paragraph', text:
      'Sabor velikaša u Rasu nije bio samo formalnost…' },
    { type: 'quote',
      text: 'Zakonom valja vladati, a ne silom; jer sila je za jedan dan, a zakon za vek.',
      attribution: 'pripisano sv. Savi' },
    { type: 'paragraph', text:
      'U sledećoj lekciji govorimo o tome kako je Nemanja iskoristio crkveni raskol…' },
  ],
};

export default lesson;
```

### Block types

```ts
type LessonBlock =
  | { type: 'paragraph'; text: string; dropcap?: boolean }
  | { type: 'heading';   level: 2 | 3; text: string }
  | { type: 'quote';     text: string; attribution?: string }
  | { type: 'image';     src: string; alt: string; caption?: string };
```

Rules:

- Exactly one `paragraph` may have `dropcap: true`, and it must be the first content block.
- `heading` `level: 2` is the largest in-body heading; `level: 3` is for sub-points.
- `quote` attribution is optional but recommended for primary-source quotations.
- `image` `alt` is mandatory and must be meaningful (not "image of …").

### File naming

```
lessons/<section-id>-<NNN>.ts
```

Where `NNN` is the lesson's position within the Section, 1-indexed and zero-padded to 3.

The lesson `id` follows the same shape (`<section-id>-<NNN>` — e.g., `nemanjici-rani-007`).

---

## 3. Eras and Sections

Both live in dedicated files at the course root:

```
packages/content/src/courses/istorija-srbije-365/
├─ course.ts
├─ eras.ts                # 8 Era records
├─ sections.ts            # ~30–40 Section records
└─ lessons/
   ├─ index.ts            # barrel: imports + exports every lesson
   ├─ <section-id>-001.ts
   ├─ <section-id>-002.ts
   └─ …
```

### Era record

```ts
{
  id: 'nemanjici',
  courseId: 'istorija-srbije-365',
  num: 'II',
  title: 'Nemanjićka Srbija',
  description: 'Od Stefana Nemanje i Svetog Save do carstva Dušana Silnog…',
  yearStart: 1166,
  yearEnd: 1371,
  yearsLabel: '1166 — 1371.',
  eraShort: 'Nemanjići',
  order: 2,
}
```

### Section record

```ts
{
  id: 'nemanjici-rani',
  courseId: 'istorija-srbije-365',
  eraId: 'nemanjici',
  title: 'Rani Nemanjići',
  subtitle: 'Od Stefana Nemanje do Stefana Prvovenčanog',
  order: 1,
  startDay: 31,
  endDay: 45,
}
```

---

## 4. Validation

`pnpm --filter @learn365/content validate` runs and must exit 0 before any commit that touches content.

It verifies:

- Total lesson count equals `course.totalLessons` (365).
- `dayNumber` values are unique and cover 1..365.
- Each Section's lessons share its `eraId`.
- Section day ranges are contiguous and non-overlapping.
- Era year ranges are monotonic and cover the course span.
- No orphan IDs (every `sectionId` in a Lesson exists in `sections.ts`, etc.).
- Every Lesson has at least one content block.
- Derived reading times (`max(1, ceil(words / 150))`) are between 4 and 15 minutes for authored lessons; the JSON must not carry `readingTimeMinutes`.
- No duplicate lesson IDs.

This validator runs in CI on every PR.

---

## 5. Stub lessons for v1 development

The product cannot render at full scale without 365 records. We do not need 365 fully-written lessons to start UI work. The strategy:

- **Fully-authored lessons**: at least 6, spread across multiple Eras (so every era shape is exercised). Initial: Day 1, Day 7, Day 31, Day 106, Day 200, Day 305 — concrete choices made by the Historical Content Editor.
- **Stub lessons**: every other lesson gets a record with metadata (title, day, section, era, year, reading time) and a single placeholder content block:

  ```ts
  { type: 'paragraph', text: 'Lekcija se uskoro objavljuje.' }
  ```

Stubs are generated by `packages/content/src/courses/istorija-srbije-365/_buildStubs.ts` running over the section/era definitions and the curated title list. Stubs convert into real lessons one at a time as the editor writes them.

The sidebar, timeline, and course overview operate at full scale from day one because they only need the metadata, not the body.

---

## 6. Tone and style (summary)

Full tone guidance lives in `docs/CONTENT_MODEL.md`. The short version:

- Serbian (Latin script for v1) — not stilted academic register, not tabloid casual.
- Neutral, non-ideological framing.
- 5–7 minutes of reading per lesson (≈ 700–1100 words at 150 wpm; the minutes are derived from the text, never written by hand).
- One clear arc per lesson: setup → core → significance.
- Avoid romanticization, polemics, anachronistic moralizing.

---

## 7. Future path — MDX / Markdown migration

The architecture is designed so v2 can move authoring out of TS without touching UI code.

### Target shape

```
content/courses/istorija-srbije-365/lessons/
└─ nemanjici-rani-001.mdx
```

Frontmatter:

```mdx
---
id: nemanjici-rani-001
sectionId: nemanjici-rani
eraId: nemanjici
dayNumber: 31
title: "Stefan Nemanja preuzima vlast"
subtitle: "Sabor velikaša u Rasu i tihi početak nove ere"
year: 1166
dateLabel: "1166."
keyPeople: ["Stefan Nemanja", "Tihomir"]
keyPlaces: ["Ras", "Studenica"]
summary: "Saborski preokret kojim Stefan Nemanja preuzima vlast…"
---

# unused, frontmatter title wins

Poslednje godine dvanaestog veka zatekle su Rasku u trenutku…  *(dropcap inferred from first paragraph)*

Stefan Nemanja je u to vreme već bio iskusan vladar mlađe braće…

## Šta je značio sabor iz 1166.

Sabor velikaša u Rasu nije bio samo formalnost…

> Zakonom valja vladati, a ne silom; jer sila je za jedan dan, a zakon za vek.
> — pripisano sv. Savi

U sledećoj lekciji…
```

### Migration mechanics

A build step in `packages/content` reads MDX, parses frontmatter (`gray-matter`), parses the body into the same `LessonBlock[]` shape (`remark` → custom AST → block array), and emits the same exported `Lesson` records.

**The consumer interface (`getLessonById`, `LessonBody`, etc.) does not change.** Only the source format changes.

### When to migrate

Trigger conditions for considering the migration:

- A non-engineer content editor is contributing regularly.
- The TS lesson files exceed ~50 fully-authored entries.
- We need image / footnote support beyond what `LessonBlock` supports today.

Until then, TypeScript modules are simpler, type-safe, and easier to grep.

---

## 8. Localization (future)

Not implemented in v1. The architecture supports it by:

- `Course.language` already exists.
- A future `lessons/<lesson-id>.<lang>.ts` (or MDX) pattern adds translations.
- Content lookup helpers will accept a `language` arg.

Out of scope for v1.

---

## 9. Authoring checklist for a single lesson

Before merging a lesson into `main`:

- [ ] File path matches `<section-id>-<NNN>.ts` convention.
- [ ] `id` matches the file name.
- [ ] `dayNumber` is correct and unique.
- [ ] `sectionId` and `eraId` match the Section record.
- [ ] `year` falls within the Era's year range.
- [ ] First block has `dropcap: true` and is a paragraph.
- [ ] Body length is between ~700 and ~1100 words.
- [ ] No HTML in any text field.
- [ ] No links inside `text` (link blocks deferred to v2).
- [ ] `keyPeople` / `keyPlaces` are non-empty when historically relevant.
- [ ] `summary` reads as a standalone sentence.
- [ ] `pnpm --filter @learn365/content validate` exits 0.
- [ ] Historical Content Editor agent has reviewed it (or a human equivalent).
