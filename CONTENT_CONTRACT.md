# Content Contract — Istorija 365

This file is no longer the contract. It is kept so that old links (and the code comments in `packages/content/src/loader/`) still land somewhere.

- **The canonical content contract is [`docs/CONTENT_MODEL.md`](docs/CONTENT_MODEL.md)** — the shapes of `Course`, `Era`, `Section`, `Lesson`, `LessonBlock`, `Source` and `UserProgress`.
- **How to write, validate and ship a lesson** (file layout, validator, `pnpm gen-content`, checklist): [`docs/CONTENT_AUTHORING.md`](docs/CONTENT_AUTHORING.md).
- **The types win** over both documents: [`packages/content/src/types.ts`](packages/content/src/types.ts). The validator is [`packages/content/src/loader/validateContentFiles.ts`](packages/content/src/loader/validateContentFiles.ts).

## Not yet written down in those two documents

Until they carry these, the validator is the reference:

- Lesson `title` ≤ 70 characters, `subtitle` ≤ 120.
- The derived `readingTimeMinutes` of an authored lesson must fall in `4..15`.
- A placeholder's body is exactly one paragraph, `Lekcija se uskoro objavljuje.` (character-exact).
- Each lesson's `year` falls inside its era's `[yearStart..yearEnd]`; era `yearStart` never decreases by `order`; era and section `order` are sequential from 1.
- `pnpm validate-content` takes an optional course directory (`pnpm --filter @learn365/content validate-content <dir>`) and exits `0` clean, `1` on validation problems, `2` on malformed JSON or missing files.
- Lesson ids (`day-NNN`) are permanent: progress and bookmarks are keyed by them, so a changed id drops the reader's mark; never reuse a day number for a different topic.
