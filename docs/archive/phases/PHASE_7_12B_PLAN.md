# Phase 7.12b — Era-opener figures (PLAN)

**Status:** Draft, awaiting owner sign-off on locked decisions before any production code.
**Date:** 2026-05-19
**Predecessors:**

- Phase 7.10 + 7.12-a — Lesson trust scaffolding + figure renderer (PR #20, `7fb1d18`). The `<LessonBody>` `image` branch renders `next/image` inside a real `<figure>` + `<figcaption>` ([packages/ui-web/src/lesson/LessonBody/LessonBody.tsx:44-59](../packages/ui-web/src/lesson/LessonBody/LessonBody.tsx#L44-L59)). The schema accepts `{ type: 'image', src, alt, width, height, caption? }` ([packages/content/src/types.ts:69-83](../packages/content/src/types.ts#L69-L83)) and the loader enforces positive integers on `width`/`height` ([packages/content/src/loader/loadCourseFromFiles.ts:337-355](../packages/content/src/loader/loadCourseFromFiles.ts#L337-L355)).
- Phase 7.11 — Lesson bookmarks (PR #21, `1fffe95`). Not load-bearing here; called out only because the bookmark toggle now sits in the lesson header above the first body block.
- [`HANDOFF.md`](../HANDOFF.md) — names this as the current next pick.
- [`docs/ROADMAP_PRE_PHASE_8.md`](../ROADMAP_PRE_PHASE_8.md) §F (Bundle F, "Phase 7.12 — Authored lesson editorial pass"). The original 7.12 bundle was split: §F's "figures + sources" became two milestones — 7.12-a (renderer + sources, shipped with 7.10) and **7.12b (this plan — image insertion only)**.

## Why this is the next phase

The figure renderer is shipped and unused. Today no lesson in the corpus carries an `image` block, so the published article reads as wall-of-text. The course already has 8 historical periods (eras), each opening on a specific day in the calendar — day 1, 46, 106, 151, 196, 231, 281, 341. Putting one curated public-domain figure on each of those 8 era-opener lessons gives the product a visual heartbeat at each period transition without requiring an editorial pass on the remaining 357 lessons.

The schedule risk is **image curation, not code.** All technical seams (renderer, schema, loader, `next/image` sizing) are already in place. The work is sourcing 8 public-domain / CC-licensed images, vetting licenses, writing Serbian captions with attribution, and adding 8 JSON edits + one `pnpm gen-content` run.

---

## 1. The 8 era-opener lessons

Computed from `content/courses/istorija-srbije-365/sections.json` (min `startDay` per era):

| Era | First-section startDay | Lesson file | Title | Year |
| --- | --- | --- | --- | --- |
| I — Praistorija i antika | 1 | `day-001.json` | Lepenski Vir — naselje na Dunavu | −9500 |
| II — Nemanjići | 46 | `day-046.json` | Srbija pre Nemanjića: Raška i Duklja | 1166 |
| III — Despotovina | 106 | `day-106.json` | Srpske zemlje posle carstva | 1380 |
| IV — Pod tuđom vlašću | 151 | `day-151.json` | Ustrojstvo Osmanskog carstva | 1600 |
| V — Srpska revolucija | 196 | `day-196.json` | Šta je Srpska revolucija | 1804 |
| VI — Kneževina i Kraljevina | 231 | `day-231.json` | Ustavobraniteljski režim | 1842 |
| VII — Jugoslavija i 20. vek | 281 | `day-281.json` | Balkanski savez 1912. | 1912 |
| VIII — Savremena Srbija | 341 | `day-341.json` | Raspad Jugoslavije — uzroci | 1991 |

`day-001` and `day-106` are already in the 6-lesson authored set (they carry `lastReviewedAt`, `sources[]`). The other 6 are auto-generated full lessons from the post-2026-05-19 corpus build — they carry full body content but no trust scaffolding yet. **Adding an image to one of them does not require also adding `byline` / `sources` first** (the renderer is independent).

---

## 2. Locked decisions needed before code

These need owner sign-off before any JSON edit. Each has a recommended option followed by the alternative.

### D1 — Insertion position inside the lesson body

**Recommended:** Insert the figure **after the first paragraph** of `content[]`. The first paragraph already carries `dropcap: true` (or the renderer auto-applies dropcap to `index === 0`, see [LessonBody.tsx:24](../packages/ui-web/src/lesson/LessonBody/LessonBody.tsx#L24)). Putting the figure between paragraph 1 and paragraph 2 preserves the editorial opening cap and gives the figure a textual lede that reads first.

Layout per era-opener after the edit:
```
<h1>Title</h1>
<p>Trust line (byline · lastReviewedAt)        ← if present
<p class="dropcap">First paragraph…</p>
<figure>                                       ← NEW
  <img …/>
  <figcaption>Caption + attribution.</figcaption>
</figure>
<p>Second paragraph…</p>
…
```

**Alternative:** Insert as the very first block (above the dropcap). Rejected because (a) it pushes the dropcap out of position one (`index === 0`) so the auto-dropcap stops firing, requiring the editor to add `dropcap: true` explicitly on paragraph 2 — a foot-gun for the 357 lessons that never get figures; and (b) hero-above-lede reads as marketing chrome, not as an editorial figure inside a published article.

### D2 — Image dimensions and format

**Recommended:**
- **Format:** WebP. Precedent: [apps/web/public/hero/hero-bg.webp](../apps/web/public/hero/hero-bg.webp).
- **Intrinsic width:** **1440 px** (2× retina against the `sizes="(max-width: 720px) 100vw, 720px"` the renderer already sets — see [LessonBody.tsx:53](../packages/ui-web/src/lesson/LessonBody/LessonBody.tsx#L53)).
- **Height:** preserve source aspect ratio. Width is locked; height varies per image.
- **Target file size:** ≤ 220 KB per image (~1.8 MB across all 8). Quality knob: WebP q=80 typical.
- **Color space:** sRGB.

**Alternative:** AVIF for better compression. Rejected for v1 — WebP support is universal in our supported browser matrix, AVIF would require a `<picture>` fallback path the renderer doesn't currently emit.

### D3 — Caption + attribution register

**Recommended:** One sentence of editorial framing in Serbian (latin script), followed by a period, followed by the attribution clause. The `caption` field is also the attribution field per the schema comment ([packages/content/src/types.ts:77-82](../packages/content/src/types.ts#L77-L82)).

Format template:
```
{Subject in Serbian, descriptive — ~10 words}. Foto: {Author / Institution}, {License code}, Wikimedia Commons.
```

Worked example for day-001:
```
Trapezasta kuća u Lepenskom Viru, rekonstrukcija u muzeju iznad Đerdapske brane. Foto: Mister No, CC BY-SA 3.0, Wikimedia Commons.
```

For public-domain works (any image older than ~95 years where author died or work was published pre-1929), the license clause becomes `javno vlasništvo` (public domain). Example:
```
Mihailo Obrenović, fotografija iz 1860-ih. Javno vlasništvo, Wikimedia Commons.
```

### D4 — Curation owner (this is the schedule risk)

**Owner decides.** The roadmap §F flagged this. Two options:

- **(a)** Owner sources the 8 images directly. Cleanest provenance trail (owner picks per-era visual register).
- **(b)** I produce a vetted shortlist (2–3 candidates per era, Wikimedia Commons URLs + license codes + suggested captions) and the owner picks one per era. Slower but lower decision overhead for the owner.

The plan defers this decision. No code can be written until images exist as binary files under `apps/web/public/lessons/`.

### D5 — Alt text policy

**Recommended:** Alt text describes the **visual content** of the image factually, in Serbian, for a screen-reader user who is not seeing the figure. It is **not** a duplicate of the caption — the caption carries the editorial framing and attribution, and is already announced as a `<figcaption>` by the figure landmark.

Example for day-001:
- `alt`: `Niz trapezastih temeljnih obrisa kuća na rečnoj terasi, sa stenom iznad Dunava u pozadini.`
- `caption`: `Trapezasta kuća u Lepenskom Viru, rekonstrukcija u muzeju iznad Đerdapske brane. Foto: …`

If the image is a portrait, `alt` says "portret čoveka u uniformi, polu-profil, na tamnoj pozadini" — not "Mihailo Obrenović" (his name belongs in the caption).

### D6 — Validator changes

**Recommended:** None. `validate.ts` should not enforce that era-openers carry an image. Reasons:

- The other 357 lessons stay correctly imageless after this phase. A validator rule on "era-openers must have an image" creates a fragile invariant where renaming or re-numbering a section silently breaks CI.
- Image curation is a manual editorial discipline; if a future authoring pass adds figures to mid-era lessons, no rule needs to change.

The existing positive-integer rule on `width`/`height` ([loadCourseFromFiles.ts:341-345](../packages/content/src/loader/loadCourseFromFiles.ts#L341-L345)) is sufficient.

### D7 — Asset directory and naming

**Recommended:**
- Directory: `apps/web/public/lessons/` (called out in `ROADMAP_PRE_PHASE_8.md` §F). New directory, currently missing.
- Per-era file: `apps/web/public/lessons/era-{order}-{slug}.webp`, e.g. `era-1-lepenski-vir.webp`, `era-2-pre-nemanjica.webp`, …, `era-8-raspad-jugoslavije.webp`.
- JSON `src` references use the public-rooted path: `"/lessons/era-1-lepenski-vir.webp"`.

Naming by era-order keeps the directory readable; the slug keeps each file self-describing without grepping the JSON.

---

## 3. File-level bundle (one PR, one commit window)

After D1–D7 are locked and the 8 images are sourced:

### Commit 1 — Add image binaries

- **NEW** `apps/web/public/lessons/era-1-lepenski-vir.webp` (1440 × ~960 WebP)
- **NEW** `apps/web/public/lessons/era-2-pre-nemanjica.webp`
- **NEW** `apps/web/public/lessons/era-3-srpske-zemlje-posle-carstva.webp`
- **NEW** `apps/web/public/lessons/era-4-ustrojstvo-osmanskog-carstva.webp`
- **NEW** `apps/web/public/lessons/era-5-srpska-revolucija.webp`
- **NEW** `apps/web/public/lessons/era-6-ustavobranitelji.webp`
- **NEW** `apps/web/public/lessons/era-7-balkanski-savez.webp`
- **NEW** `apps/web/public/lessons/era-8-raspad-jugoslavije.webp`

No code change in this commit. Independent shippability: an app build with the binaries but no JSON edits is identical to today (images are present in `/public` but unreferenced).

### Commit 2 — Insert `image` blocks in 8 JSON lessons + regen

Edit `content/courses/istorija-srbije-365/lessons/day-{001,046,106,151,196,231,281,341}.json` — insert one `image` block into `content[]` after index 0 (per D1). The block carries `src`, `alt` (per D5), `width: 1440`, the per-image `height`, and `caption` (per D3).

Then run `pnpm gen-content` to refresh `packages/content/src/courses/istorija-srbije-365/_generated.ts`. The generated file gets committed alongside the JSON edits — same discipline as every prior content phase.

Independent shippability: this commit alone (without commit 1) would fail at runtime because the WebP files would 404. But commit 1 + commit 2 together leave the app in a green state. The PR ships as one merge.

### No code changes

No `.ts`/`.tsx`/`.css` files are modified. The renderer, schema, loader, and validator already do what this phase needs.

---

## 4. Verification

### Automated gates (CI)

- `pnpm typecheck` — must stay green. No type changes.
- `pnpm lint` — must stay green.
- `pnpm test` — must stay green. No new unit tests are required for this phase (the renderer was unit-tested at 7.10/7.12-a; this phase only adds data).
- `pnpm build` — must stay green. Next.js will optimize the 8 WebPs through the `next/image` pipeline at build.
- `pnpm validate-content` — must stay green. The loader's positive-integer rule on `width`/`height` is the only relevant check.
- `pnpm e2e` (Playwright, 5 browser profiles) — must stay 48 pass / 2 documented WebKit skips. **Add no new e2e assertion in this phase** — the existing lesson-reader smoke already loads day-001 and renders its body; if the figure breaks, the smoke fails.

### Manual review

Owner walks the 8 era-opener lessons on the Vercel preview build at three breakpoints:

- **390 px (iPhone 13 mini width):** figure fills viewport edge-to-edge inside the lesson reader column. Caption wraps to 2–3 lines but remains readable. The dropcap on paragraph 1 above is undisturbed.
- **720 px (small tablet / break point of the `sizes` rule):** figure transitions from `100vw` to the fixed 720 px column. No layout jump.
- **1280 px (desktop):** figure caps at 720 px column width centered in the reader. Border rule (`1px solid var(--rule)`) reads as editorial frame, not as a thumbnail outline.

Per-era visual register sanity check: do the 8 figures sit together as a coherent editorial set, or does one feel like a stock photo while another is a museum photo? If yes, swap that one in a follow-up commit.

### Screenshot review

Capture each era-opener at 390 + 1280 widths after the JSON edits are in. Pack lives at `screenshots/era-openers/` for the PR description. Use the existing `pnpm screenshots` flow but scope to the 8 lesson routes. Caveat noted in memory: the screenshot capture race can produce unstyled-looking chrome on a freshly built dev server; re-capture if the TopBar reads as unstyled — this is the documented React 19 streaming-CSS race, not a real regression.

---

## 5. Risks and mitigations

### R1 — Image licensing trap (HIGH)

Wikimedia Commons hosts many images mislabeled as CC-BY-SA when they are actually `non-commercial` or `editorial use only`. Mitigation: every image we pick must carry one of these license codes in its Commons file page: `Public domain`, `CC0`, `CC BY 4.0`, `CC BY-SA 3.0`, `CC BY-SA 4.0`. **Reject anything labeled `non-commercial`, `editorial use only`, `fair use`, or with a missing license field.** Record the license code in the caption per D3.

### R2 — WebP encoding artifacts on photographic images (MEDIUM)

WebP q=80 is usually fine for portraits and architectural shots; archival document scans with sharp text edges sometimes show ringing. Mitigation: visually compare each WebP against the source JPEG/PNG before committing. Bump quality to q=85 if needed, accept the larger file size.

### R3 — Caption / attribution drift (LOW)

The caption is also the attribution field by schema convention. If an editor later edits the caption for tone, they could accidentally remove the attribution clause. Mitigation: caption convention is documented in [`docs/CONTENT_AUTHORING.md`](./CONTENT_AUTHORING.md) — confirm it is, or add a one-line note pointing to the schema comment in `types.ts`.

### R4 — Mobile layout regression (LOW)

The renderer already shipped at 7.10. The risk is that no real image was tested at the 360 / 390 / 720 / 1280 widths until now. Mitigation: the manual review in §4 catches it before merge.

---

## 6. Out of scope

- Figures for non-era-opener lessons. The corpus has 365 lessons; we add 8 figures, 357 stay imageless. A future "section-opener figures" or "lesson-by-lesson editorial pass" is its own bundle.
- Per-paragraph mid-body figures. Even on the 8 era-openers, this phase inserts exactly one figure per lesson at the position locked in D1.
- A `next.config.mjs` `images.remotePatterns` change. All 8 images are local under `/public`, no remote loader is involved.
- A separate `/izvori` route or a global "credits" page for image attribution. Captions carry attribution per D3; that is the v1 contract.
- Image CDN. The roadmap §F is explicit: "keep assets in `apps/web/public/lessons/` for v1."
- Auto-regen `_generated.ts` on JSON save (the husky pre-commit / Turbo input dep idea from `HANDOFF.md`). That is a separate quality-of-life commit and out of scope for this phase.
- Editorial review of the 6 seed lessons for historical voice (Phase 5 carry-forward). Independent of figure work.
- Seed bylines (Phase 7.10 carry-forward). Independent of figure work.

---

## 7. Effort and timeline

- **Image curation (the schedule risk):** half a day to one day depending on the D4 path picked. Owner-time, not assistant-time.
- **WebP encoding + filing under `/public`:** ~30 minutes once images are picked.
- **JSON edits + `pnpm gen-content` + gate run:** ~30 minutes.
- **Screenshot review + owner pass:** ~30 minutes.

Total assistant time, after the 8 images exist: **~1 hour**. Total wall-clock including curation: depends on D4.

---

## 8. Definition of done

- [ ] 8 WebP files exist under `apps/web/public/lessons/`, all ≤ 220 KB, all 1440 px wide.
- [ ] 8 lesson JSONs carry one `image` block each, inserted per D1.
- [ ] `_generated.ts` refreshed and committed.
- [ ] All 5 CI gates green (`typecheck`, `lint`, `test`, `build`, `validate-content`).
- [ ] Playwright suite still at 48 pass / 2 documented skips.
- [ ] Each of the 8 era-opener lessons renders the figure at 390 / 720 / 1280 with no layout regression on neighbouring blocks.
- [ ] Each caption ends in a valid attribution clause naming source + license.
- [ ] `docs/PROJECT_STATE.md` gains a "Phase 7.12b — done" entry; `HANDOFF.md` next-step pointer advances to Phase 7.5 (mobile lesson sticky chrome) per the roadmap ship order; this plan moves to `docs/archive/phases/`.

---

## 9. Action requested from the owner

Before any production code or JSON edit:

1. Confirm or override **D1** (figure after paragraph 1, not before).
2. Confirm or override **D2** (WebP, 1440 px, q=80, ≤ 220 KB target).
3. Confirm or override **D3** (Serbian caption + attribution clause baked into the same string).
4. Decide **D4** — owner sources the images directly, or asks me to produce a vetted shortlist.
5. Confirm or override **D5** (alt = factual visual description, not name / not caption duplicate).
6. Confirm or override **D6** (no validator change).
7. Confirm or override **D7** (path / naming convention).

If D4 = "produce a shortlist," I will compile candidate Wikimedia Commons URLs + license codes + per-era proposed captions in a follow-up message; no code is written until you pick.
