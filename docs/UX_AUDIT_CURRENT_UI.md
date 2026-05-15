# History 365 — Current UI Audit

**Date:** 2026-05-15
**Reviewer:** Claude (multi-role audit — first-time user, returning user, premium product designer, editorial reviewer, commercial reviewer)
**Branch reviewed:** `feat/phase-6-9-hero-toolbar-cleanup` (HEAD `61f4475`)
**Method:** Source-level inspection of `apps/web` + `packages/ui-web` + content. No live browser run.
**Predecessor:** [`docs/UX_REVIEW_2026-05-15.md`](./UX_REVIEW_2026-05-15.md) — most of its findings shipped in Phases 6.8 + 6.9. This audit is the next pass with fresh eyes on what is left.

---

## 1. Executive Summary

**What's working.** The Phase 6.8 / 6.9 declutter pass landed. The lesson page is no longer chaotic — sidebar header is two lines, breadcrumbs are real links, the article left-anchors against the rail, eras collapse to "where am I", placeholder rows are visibly faint, and the mobile drawer is a single calm column. Editorial identity (Spectral serif on warm cream, deep evergreen accent, hairline rules) is genuinely tasteful and consistent across every screen. Accessibility work is real: focus rings, skip link, ARIA, focus trap in the drawer, body scroll lock.

**Biggest remaining UX risk.** The product has 6 authored lessons and 359 placeholders, and the user can walk into placeholders unannounced via the **previous/next** strip, even though the sidebar now flags them. From Day 1 the "Sledeća lekcija" link points at Day 2, which is empty. A first user clicking *next* twice lands in two consecutive "u pripremi" cards. Phase 6.8g half-fixed this; the prev/next nav is the unfixed half.

**Biggest visual / design opportunity.** The home hero is the screen most viewers will judge the whole product on, and it currently shows **two product names** within 80 vertical pixels: the topbar brand ("History 365") and the h1 ("Istorija Srbije 365"). The course title is also the page title. For a premium product this is a quiet identity stutter. Tightening it (one name dominant, the other a supporting tagline) is the single highest-leverage move.

**Does it feel premium?** Yes — about 7.5 / 10. The palette, type, spacing, and restraint all read as premium. What holds it back is (a) the placeholder-walk problem, (b) a few clusters of small redundant chrome (two progress indicators on mobile lesson, two intro sentences in the eras section, two "where am I" rails stacked on desktop lesson), and (c) absence of any trust signal for a history product (no source, no editor, no "about").

**Is the product direction clear?** Mostly yes from the hero copy alone — "kroz osam epoha i 365 kratkih lekcija prati razvoj Srbije … jedan dan, jedna lekcija, jedan jasan put" is a confident, well-edited line. The thing it doesn't yet communicate is **trustworthiness** — who wrote this, where the facts come from, why this is the right product to learn from. That gap doesn't show up in the calm-luxury surface but it will matter the moment a user wonders "is this accurate?"

---

## 2. First-Time User Impression

**First 5 seconds (home, mobile).** I see a warm cream page, a small green "H" mark with "History 365" in serif at top-left, a faint progress capsule "Ukupno · 0 / 365 · ▁" at top-right. Below: a small uppercase label "Dnevni kurs istorije", a large serif title "Istorija Srbije 365", a one-sentence description, and a dark pill button "Započni kurs →". Behind it, a parchment-textured backdrop. **I understand the product.** This is a daily history course about Serbia, 365 days, 8 epochs, ~8 min each. That is rare clarity for a free landing page — well done.

**What I want to click.** The primary CTA ("Započni kurs →") is unambiguous. The "Preporučeno za početak" card under the hero is the natural second click. Both are good.

**What confuses me.** Three small frictions:

1. **Two product names.** "History 365" (topbar) and "Istorija Srbije 365" (h1) within 80px. They're not contradictory — one is the brand, one is the course — but as a first user I don't know that yet, so I parse two titles. The h1's eyebrow "Dnevni kurs istorije" doesn't disambiguate.
2. **"Osam epoha · Putovanje kroz 365 dana".** This h2 doesn't tell me what the eras *are*. It is a poetic restatement of "365 days through 8 eras", which the hero already said. I'd want the section title to give me information I don't have yet — e.g. *"Od Lepenskog Vira do Savremene Srbije"* — so I can taste the range.
3. **"O aplikaciji" disabled.** A nav item that's intentionally not clickable, with a tooltip "Uskoro", quietly tells me the product is unfinished. First-time impression: small dent.

**Is the value proposition clear?** Yes for "what". No for "why this product specifically". I learn it's structured daily, premium-feeling, 8 min/day. I don't learn who wrote it, what sources it draws on, or why I should trust the historical voice. For a museum-grade product this is the missing piece.

---

## 3. Home Page Review

### 3.1 Header / brand
**Issue:** The topbar reads `[H mark] History 365   |   Početna · Kurs · O aplikaciji (disabled)   |   Ukupno · 0/365 ·▁`. The brand is English, the nav is Serbian, the disabled item is Serbian, and the page below is Serbian.
**Why it matters:** Mixed-language brand is a deliberate choice, but the disabled nav item is broadcasting "incomplete product" on every screen.
**Suggested improvement:** Either build a minimal `/o-aplikaciji` (mission paragraph + sources note + author/editor + plain contact) or hide the link until it exists. Right now it's the only piece of TopBar furniture that costs trust.
**Where:** [packages/ui-web/src/primitives/TopBar/TopBar.tsx:48-50](packages/ui-web/src/primitives/TopBar/TopBar.tsx#L48-L50)

### 3.2 Hero copy and h1
**Issue:** The hero h1 is the course title from `course.title` (= "Istorija Srbije 365"). The TopBar already shows "History 365" 32px above. So the user sees two product titles back-to-back. The eyebrow "Dnevni kurs istorije" sits between them as a category label, not a unifier.
**Why it matters:** Premium products generally let one name dominate the hero. Two names competing reads as "we haven't decided yet."
**Suggested improvement:** Pick one of two structures:
- (a) Hero h1 = *"Istorija Srbije, u 365 dana"* (a phrase, not the product name). Drop the eyebrow, or make it the kicker. The brand is held by the TopBar.
- (b) Hero h1 = *"Istorija Srbije 365"* (current), eyebrow = a real value statement, not a category label. e.g. *"Premijum dnevni kurs · 8 minuta dnevno"*.
**Where:** [apps/web/app/page.tsx:11-39](apps/web/app/page.tsx#L11-L39)

### 3.3 The "365 lekcija · oko 8 min dnevno" meta line
**Issue:** Sits next to the CTA and repeats "365 kratkih lekcija" already in the body description above it. By the time the user reaches this line they have seen "365" three times in three different framings (topbar progress, body copy, meta).
**Why it matters:** A premium hero says one thing well. Saying it three times softens it.
**Suggested improvement:** Drop this meta, or replace with the missing trust signal: *"Bez naloga, bez registracije."* That is information the user actually doesn't have yet.
**Where:** [apps/web/app/_components/HomeHeroCta.tsx:54-57](apps/web/app/_components/HomeHeroCta.tsx#L54-L57)

### 3.4 The "Preporučeno za početak" / current lesson card
**Issue:** Strong premium component. The state-aware label is honest. One smallness: the eyebrow is *"Preporučeno za početak"* (idle) — five words for "start here". `"Počni odavde"` or `"Prva lekcija"` would be cleaner.
**Why it matters:** The verbose label slightly undermines the card's confidence.
**Suggested improvement:** Tighten the idle label to *"Prva lekcija"* or *"Početak puta"*. Active stays *"Nastavi gde si stao"* (or shorter: *"Nastavak"*). Done stays *"Nedavno završeno"*.
**Where:** [apps/web/app/_components/HomeCurrentLessonCard.tsx:17-21](apps/web/app/_components/HomeCurrentLessonCard.tsx#L17-L21)

### 3.5 "Osam epoha · Putovanje kroz 365 dana"
**Issue:** Title says nothing the hero hasn't said. The intro paragraph below says approximately the same thing again ("Osam epoha te vode hronološki kroz ključne ličnosti…"). The eyebrow, h2, and intro paragraph all carry "this is the journey through the 8 eras" message — three times.
**Why it matters:** First-time scrollers will read this as "I'm being told the same thing again". Section openers should add information.
**Suggested improvement:** Either:
- Drop the intro paragraph (eyebrow + h2 + the timeline itself is enough), or
- Change the h2 to a *taste of the range*, e.g. *"Od Lepenskog Vira do današnjeg dana"*. The eras are already labeled below; the h2 doesn't need to count them.
**Where:** [apps/web/app/page.tsx:60-68](apps/web/app/page.tsx#L60-L68)

### 3.6 Era timeline rail (home)
**Issue:** Each band on the home timeline links to the **first lesson** of that era, not to the eras section on the Course page. So clicking on "VIII Savremena Srbija" lands the user inside a stub lesson on Day 346, not on a course-page view of Era VIII.
**Why it matters:** The home page sells the journey; the user clicking on an era band is exploring *what's in that era*, not committing to read its Day 1 yet. Landing on a placeholder right after a confident hero is jarring.
**Suggested improvement:** Link era bands to a course-page anchor (`/course/[id]#era-{eraId}` with `scroll-margin-top` honoring the sticky topbar), not to the first lesson. This keeps the home a *visual taste* and lets exploration happen on the structural page.
**Where:** [apps/web/app/_components/HomeEraTimeline.tsx:42-46](apps/web/app/_components/HomeEraTimeline.tsx#L42-L46)

### 3.7 Spacing and hierarchy
Hero → current lesson card → eras section. Vertical rhythm is calm, breathing room is generous. Mobile breakpoint at 720px tightens this appropriately. **No issue here.** This is the strongest part of the home page.

### 3.8 The atmospheric backdrop
The 4-layer composite (CSS wash + image at `mix-blend-mode: multiply` + cream overlay + mask gradient) plus mobile focal-point override is technically beautiful but fragile. Worth a deliberate viewport QA at 360 / 768 / 1280 / 1920. **Not yet flagged as broken** — flagging as risk because a muddy hero photo is worse than no photo. (Previous review item 3.2; still applies.)

---

## 4. Course Page Review

The course page is the navigation hub. It's clearer than the lesson page, but it has its own clutter.

### 4.1 Header — *"Počni od Dana 001 →"*
**Issue:** The header has the eyebrow "Kurs", h1 course title, and a link "Počni od Dana 001 →" — always. For a user with progress, this is "start over". For a first user, fine.
**Why it matters:** The CourseProgress card immediately below already shows a state-aware "AKTUELNO · …" or "ZA POČETAK · …" row that does the right thing. So the header link is at best redundant (fresh user) and at worst a misleading "start over" affordance (returning user).
**Suggested improvement:** Drop the header link. The CourseProgress card 40px below carries the canonical "start / continue" CTA. Keep the header to eyebrow + title only.
**Where:** [apps/web/app/course/[courseId]/page.tsx:33-40](apps/web/app/course/[courseId]/page.tsx#L33-L40)

### 4.2 CourseProgress card — current + next rows feel parallel for a fresh user
**Issue:** A fresh user sees two stacked rows: `[idle dot] ZA POČETAK · ... · "Lepenski Vir" · DAN 001` and `[idle dot] SLEDEĆE · "Vinčanska kultura" · DAN 002`. Both look identical (idle dot, same row chrome). The visual hierarchy doesn't say "the first is your actual entry, the second is just informational".
**Why it matters:** Two equal-weight rows for an empty state read as "pick one" — but only the first row is the action. Worse: Day 002 is a placeholder, so the second row promises content that isn't there.
**Suggested improvement:** For `hasStarted === false`, suppress the SLEDEĆE row or downgrade it visually (smaller text, no dot, no clickable hover). The empty-state should be a single, confident call: "your first lesson is Day 1 — Lepenski Vir."
**Where:** [packages/ui-web/src/course/CourseProgress/CourseProgress.tsx:79-96](packages/ui-web/src/course/CourseProgress/CourseProgress.tsx#L79-L96)

### 4.3 JumpToDay still feels out of place
**Issue:** Phase 6.9 moved it from the page header to the eras-section heading, beside the h2 "Osam epoha, kroz 365 dana". Better than before. But a numeric input + "Idi" submit pair is still the only form widget in an otherwise editorial page. The user has the era → section accordion immediately below that lets them reach any of the 365 days in 2–3 calm clicks.
**Why it matters:** "Idi na dan" is a power-user feature. In a v1 with 6 authored lessons, it overwhelmingly leads the user to placeholders. The browse path (accordion) is more useful right now because completion dots and the "Uskoro" chip act as a guide; the jump path is blind.
**Suggested improvement:** Hide JumpToDay in v1 until there's enough authored content to justify a fast-jump. Or replace with a small "Pređi na Dan…" text link that focuses a hidden form on click — quieter, less SaaS-form-y.
**Where:** [apps/web/app/course/[courseId]/page.tsx:55-58](apps/web/app/course/[courseId]/page.tsx#L55-L58)

### 4.4 Era → section → lesson hierarchy
**The hierarchy itself is excellent.** CourseCard sits as the era heading; an indented panel under it carries the era description paragraph + the section accordions. Accordions are single-open. Lesson rows show D001-style day, completion dot, title, and either reading time or "Uskoro" chip. This is the kind of clear scannable structure the brief asks for. Pluralsight-comparable.

One small issue: the CourseOverviewEras.tsx renders **all 8 eras + their indented panels always expanded**. The user sees 8 era descriptions stacked, each followed by a collapsed list of section accordions. That's editorial *and* navigational at once. On a long scroll it works (the section accordions stay collapsed until clicked, so it doesn't explode in height); but the era descriptions and the section accordions are two different reading modes interleaved. A user scanning for "where am I" reads era descriptions; a user navigating wants the accordion. Mixing both per era doubles the page height.

**Suggested improvement:** Consider making the era's *description paragraph* the visible part by default and the *section accordions* a "Vidi 4 odeljka" disclosure below it. The page becomes 8 editorial blocks with optional drill-down — cleaner, more premium.
**Where:** [apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx:142-166](apps/web/app/course/[courseId]/_components/CourseOverviewEras.tsx#L142-L166)

### 4.5 Progress indicators
The CourseProgress card uses a 120px progress ring with "X / 365 završeno" beneath. Eras have a thin progress bar inside each CourseCard. Sections have a tiny "X / Y" counter in the accordion header. **Three progress densities, three legitimate scales — this is good information design.** No issue.

### 4.6 Mobile readability
On mobile (≤720px), CourseCards reflow from a 4-column grid to a 3-area stack (num + title + status on top, progress underneath). JumpToDay becomes full-width. Era child panels' left indentation tightens. Scannable, but the page becomes long — about 8 era descriptions + 28 collapsed sections × their row heights = ~3000px scroll on a phone. Single-open sections help. **Acceptable.** Linking section accordions to anchor URLs (so the back button on a lesson page restores scroll position to the right accordion) would polish it further; right now the page resets to top on every back-navigation.

---

## 5. Lesson Page Review

This is the screen the previous review flagged as chaotic. After Phases 6.8 + 6.9 it is dramatically better. What remains:

### 5.1 The desktop sidebar header reminds the user of the course they're in
**Issue:** Sidebar header is now `KURS / Istorija Srbije 365`. The TopBar 64px above already shows "History 365" + a Kurs link that's marked active. So the sidebar header is telling the user something they already see.
**Why it matters:** A calm rail starts with the era tree immediately. The two-line header sits where the user expects navigation to begin.
**Suggested improvement:** Drop the sidebar header entirely. Let the rail be: top of column = first EraGroup. The course identity is held by the TopBar.
**Where:** [packages/ui-web/src/course/CourseSidebar/CourseSidebar.tsx:70-74](packages/ui-web/src/course/CourseSidebar/CourseSidebar.tsx#L70-L74)

### 5.2 Two "where am I" rails stacked on desktop
**Issue:** Above the lesson title, the user sees:
1. Breadcrumbs: `Početna / Istorija Srbije 365 / Od praistorije do ranog srednjeg veka / DAN 001`
2. HistoricalTimeline rail with 8 era bands and a year-interpolated marker
3. LessonHeader eyebrow: `DAN 001 · Praistorija i rani srednji vek · 8 min čitanja · oko 9500. p.n.e.`

That's three locator strips before the title. Each is informative, but combined they read as *"in case you forgot where you are, here it is again, again, again"*.

**Why it matters:** A premium reader page lets the title own the top of the screen. The current stack pushes the h1 about 250px below the breadcrumbs on desktop.
**Suggested improvement:** Pick two of three. The combination that feels most premium to me:
- Keep the timeline as the *visual* locator (it carries unique information — proportional eras, marker, progress fill).
- Keep breadcrumbs as the *navigational* locator (Phase 6.8d made them real links).
- Compress the LessonHeader eyebrow to just `8 min čitanja · 9500. p.n.e.` — drop the DAN and era restatement, since both are already in the breadcrumb and timeline.

Or, more radical: drop the inline timeline on the desktop lesson page. Move it back to the home page only. The desktop sidebar already shows "where in the tree" — the timeline is more useful as a journey-summary on home than as a per-lesson chrome strip.
**Where:** [packages/ui-web/src/lesson/LessonReader/LessonReader.tsx:55-69](packages/ui-web/src/lesson/LessonReader/LessonReader.tsx#L55-L69), [packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx:18-28](packages/ui-web/src/lesson/LessonHeader/LessonHeader.tsx#L18-L28)

### 5.3 Section is the missing breadcrumb level
**Issue:** The breadcrumb is `Početna / Course / Era / DAN`. The user is sitting inside a section ("Praistorija i antika") — that's the title they see in the sidebar's expanded accordion, the title they tapped to get here. But the breadcrumb skips it.
**Why it matters:** "Section" is the most granular *editorial* grouping the user thinks in. Eras are too coarse ("rani srednji vek") and DAN too fine. Section is "what am I learning right now".
**Suggested improvement:** Either add a 5th breadcrumb level (Section title, linking to the course page's anchor for that section), or replace the era crumb with the section crumb. Section is the more useful level.
**Where:** [apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx:150-158](apps/web/app/course/[courseId]/lesson/[lessonId]/LessonPageClient.tsx#L150-L158)

### 5.4 Prev/Next nav doesn't warn about placeholders
**Issue:** From Day 1 (authored), `Next` points at Day 2 (placeholder). The card label says only `DAN 002 · "Vinčanska kultura"`. There is no visual signal that the next lesson is empty. Click → land on "Ova lekcija je u pripremi."
**Why it matters:** This is the **single biggest dead-end risk** the product still has. The user just finished reading a good lesson, clicked the obvious next-action, and got nothing. With 359 placeholders that's most of the journey for now.
**Suggested improvement:**
- Minimum: dim the placeholder side of the prev/next card with the same `--faint` treatment LessonNavItem now uses, and add a small "Uskoro" chip in the corner.
- Better: if the immediate next is a placeholder, surface a *"Sledeća dostupna lekcija: DAN 007 — Vinča"* link below or instead. The 6 authored lessons (1, 7, 31, 106, 200, 305) are a known set — `getLessons(courseId).find(l => l.dayNumber > current && !l.isPlaceholder)` is a one-liner.
- Best of both: keep the literal Day +1 card (so the user can still peek), but add the *"… ili pređi na sledeću spremnu lekciju"* affordance.
**Where:** [packages/ui-web/src/lesson/PreviousNextLessonNavigation/PreviousNextLessonNavigation.tsx:29-66](packages/ui-web/src/lesson/PreviousNextLessonNavigation/PreviousNextLessonNavigation.tsx#L29-L66)

### 5.5 MarkAsCompletedButton label
**Issue:** *"Označi kao završeno"* (4 words) → *"Označeno kao završeno"* (3 words, different first word). The icon side swaps (trailing → leading). A click triggers a label change *and* an icon position swap *and* an aria-pressed flip.
**Why it matters:** Small layout jolt on what should be a confident, definitive interaction. Premium products often go with *"Označi"* / *"Završeno ✓"* (1 word states, icon always on the same side, no shift).
**Suggested improvement:** Shorten labels to a single word each and fix the icon side. Either *"Završi"* / *"Završeno"* or *"Označi"* / *"Označeno"*. Whatever the choice, no layout shift on toggle.
**Where:** [packages/ui-web/src/lesson/MarkAsCompletedButton/MarkAsCompletedButton.tsx:21-32](packages/ui-web/src/lesson/MarkAsCompletedButton/MarkAsCompletedButton.tsx#L21-L32)

### 5.6 Mobile sticky chrome
**Issue:** On mobile, the user has the **TopBar** (64px, with brand + progress capsule) plus the **LessonContextHeader** (~80px, two rows: Sadržaj / DAN 001 / spacer  +  era label / progress bar / X-of-Y count). Total ~144px of sticky chrome on top of a 667px-tall iPhone SE viewport = ~22%. The lesson content begins at the bottom of the screen and the user scrolls right away.
**Why it matters:** Each piece of sticky chrome is individually justified, but stacked they cost real reading area. The bottom row of LessonContextHeader (era label + progress bar) is also pure information — nothing to interact with — yet it eats real estate at every scroll.
**Suggested improvement:** Collapse the LessonContextHeader's two rows into one: `[Sadržaj] DAN 001 / 365 · Era kratko [progress dot or %]`. Or hide the bottom row after the user scrolls past the title (intersection observer). The minimum useful state on scroll is `[Sadržaj] DAN 001`.
**Where:** [apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx:45-83](apps/web/app/course/[courseId]/lesson/[lessonId]/LessonContextHeader.tsx#L45-L83)

### 5.7 The placeholder "Uskoro" state
**Phase 6.9 polished this well.** Eyebrow + heading + 2-line note inside a calm bordered card. The copy *"Ova lekcija je u pripremi. Sadržaj za ovaj dan još nije objavljen. Kurs se postepeno popunjava — vrati se ovamo uskoro."* is honest and editorial. **No issue with the state itself.** The issue is that **the user keeps arriving here** because the navigation around it doesn't deflect (see 5.4).

### 5.8 Unused `section` prop in LessonReader
Minor — `void section;` in `LessonReader.tsx:50`. The previous review flagged it; still there. Either render a section label (which would help orientation per 5.3) or drop it.

---

## 6. Content / Copy Review

### 6.1 Brand voice
The Serbian copy is consistently formal-but-warm, latinica, editorial in register. There are no SaaS-ish phrases ("Get started today", "Join the community"). That is exactly right for the product positioning. The 8 era descriptions in [eras.ts:15-127](packages/content/src/courses/istorija-srbije-365/eras.ts#L15-L127) are uniformly strong — punchy, concrete, take a stance. Era VIII's *"Ratovi devedesetih, demokratske promene, evropski put i pitanja koja Srbija još uvek otvara"* is editorial writing, not data-entry.

### 6.2 Day-label normalization
Phase 6.8f normalized `Dan` / `DAN` / `D001`. Now: `DAN 001` in headers/breadcrumbs, `D001` in tabular sidebar/range columns. Consistent. **Resolved.**

### 6.3 Copy items worth tightening
| Where | Current | Suggested |
|---|---|---|
| `HomeHeroCta.tsx:55` | *"365 lekcija · oko 8 min dnevno"* | drop, or replace with *"Bez naloga, bez registracije."* |
| `HomeCurrentLessonCard.tsx:18` | *"Preporučeno za početak"* | *"Prva lekcija"* or *"Počni odavde"* |
| `LessonContextHeader.tsx:59` | *"DAN 001 / 365"* | *"DAN 001"* (the / 365 duplicates the topbar capsule) |
| `MarkAsCompletedButton.tsx:24,28` | *"Označi kao završeno"* / *"Označeno kao završeno"* | *"Završi"* / *"Završeno ✓"* (single word, fixed icon side) |
| `course/page.tsx:52` | *"Osam epoha, kroz 365 dana"* | *"Od Lepenskog Vira do današnjeg dana"* (give a taste, not a count) |
| `page.tsx:62-67` | three-layer "Osam epoha / Putovanje kroz 365 dana / eight-eras intro paragraph" | drop the intro paragraph or the h2 — keep one |
| `CourseProgress.tsx:91` | *"ZA POČETAK"* (all caps) | *"PRVA LEKCIJA"* — more specific to a fresh user |
| `TopBar.tsx:50` | *"O aplikaciji"* (disabled, faint) | build it or hide it |

### 6.4 Authored lesson content
I read [day-001 Lepenski Vir](packages/content/src/courses/istorija-srbije-365/lessons/authored/) — the prose is formal, narrative-driven, cites a real archaeologist. Per the project state, editorial review of the 6 authored lessons is still an outstanding manual gate. **No issue from the source side that I can see** — the structure is good (paragraphs, headings, a quote). The risk surface here is whether the 6 lessons hold up under a historian's read; that needs the manual gate.

### 6.5 Trust signals — currently absent
For a history product the user will at some point think *"can I trust this?"*. The app currently has:
- No author / editor name anywhere
- No mention of sources
- No "about" page (it's stubbed to "Uskoro")
- No copyright line, no imprint, no contact
- No footer at all

This is the largest content gap. A single editorial footer with *"Uredio · Pavle Kukrić · Konsultovani izvori · …"* would do an enormous amount of work for perceived legitimacy. v1 is allowed to be minimal but it should not be anonymous.

---

## 7. Business / Product Feedback

**Would users pay for this?** Maybe, once two things are true:
1. **More than 6 of 365 lessons are written.** Currently the value-per-paid-day is 6/365 = 1.6%. Even at $9.99 lifetime, that's a hard sell against "I'll come back when it's done". A reasonable launch threshold is probably ≥30 authored lessons (≥8%) so a paying user gets at least a month of content immediately, with a credible cadence promise for the rest.
2. **Trust is visible.** Who wrote it, what sources, what editorial standard. See 6.5.

**What makes it valuable?** The premium reading experience is already strong. The 365-day frame is a clear scope — *"buy once, learn for a year"* is a real value prop (vs. open-ended subscriptions). The editorial palette and serif type let the product compete with print-quality history publications, not against Duolingo or Khan Academy.

**What is missing from perceived value?**
- **Sample lesson preview without committing.** The hero CTA is "Započni kurs" — a commitment. Adding a small *"Pogledaj kako izgleda lekcija →"* link near the CTA, pointing at Day 1 with a "this is a sample" framing, lowers the activation cost.
- **A second authored lesson visible from the home page.** Right now the CurrentLessonCard shows only Day 1. The 6 authored lessons are scattered (1, 7, 31, 106, 200, 305). A small "Šta još mogu da pročitam danas?" carousel of the 6 authored cards would convert the placeholder problem into a strength: *"6 lekcija je već gotovo, ostalo dolazi po planu"*.
- **No "how this works" beat.** The product is unfamiliar shape (not a course player, not a blog). One screen — even just three bullets — explaining the daily-habit promise would help.

**Does it communicate the "daily learning habit"?** Partially. The hero says "Jedan dan, jedna lekcija, jedan jasan put." That's the promise statement. But there's no surface that supports the habit — no "today's date · today's lesson", no streak (deliberately excluded), no email signup (out of v1 scope). The product depends on the user *remembering* to come back. For v1 that's fine; for commercial readiness, a single home component "DANAS · 15. maj 2026 · Dan 135 — Hatišerif" would close the loop.

**Does it feel trustworthy?** Visually, yes. Editorially, the absence of author/sources is the question mark.

**Conversion / retention levers:**
- Conversion: trust footer + sample-lesson affordance + sub-tagline that says "no signup, no payment".
- Retention: a "your spot" callback on home that knows yesterday's date and prompts today's lesson by date, not by last-opened position. Phase-out of placeholder-walk via 5.4.

---

## 8. Visual Premium Score

| Dimension | Score / 10 | Why |
|---|---|---|
| Visual polish | **8** | Editorial palette is genuinely tasteful. Spacing rhythm is intentional. The only papercuts are the few redundant chrome clusters (5.2, 5.6). |
| Clarity | **7** | Hero, current-lesson card, sidebar tree, breadcrumbs — all clear individually. Loses a point for 5.2 (three locators stacked) and 5.4 (prev/next walking into emptiness). |
| Premium feel | **7.5** | Calm, restrained, museum-adjacent. Loses a point for the disabled "O aplikaciji" link and the verbose action labels. |
| Mobile usability | **7** | LessonContextHeader is good; mobile drawer is calm. Sticky chrome on the lesson page is the main cost. Home/course mobile readability is solid. |
| Content hierarchy | **8.5** | Era → Section → Lesson is the strongest part of the app. Era I rename closed the historical-honesty bug. Section absence in breadcrumb is the only remaining flaw. |
| Commercial readiness | **5** | The visual product is paid-grade. The thing for sale is 6/365 = not yet shippable. The trust/imprint gap blocks any paid launch. Both are content/business issues, not UI bugs. |

**Overall:** ~**7.5 / 10**. Strong base. The premium feel is real; what holds it back is the placeholder gap and a few clusters of small redundancy. Both are addressable without redesign.

---

## 9. Prioritized Improvement List

### Must fix before user testing
1. **5.4 — Prev/Next nav must signal placeholders** *and* offer a "next available" jump. This is the worst dead-end remaining.
2. **3.1 — Build or hide `/o-aplikaciji`**. A disabled nav item on every page is a constant trust dent.
3. **6.5 — Add a minimal editorial footer**: editor name, "izvori" line, a contact email. One row, three pieces of info. Without this the product reads as anonymous.
4. **5.5 — Tighten MarkAsCompletedButton** to one-word labels and a fixed icon side. Tiny but the user clicks this dozens of times per session.

### Should fix for premium polish
5. **5.1 — Drop the sidebar header on the lesson page** (KURS / course title is duplicate of TopBar).
6. **5.2 — Compress the desktop lesson "where am I" stack** — pick two of (breadcrumbs / timeline / eyebrow). Best candidate to compress: shorten the LessonHeader eyebrow to reading-time + year only.
7. **3.5 — Eras section on home: drop the intro paragraph *or* re-write the h2** to be a taste-of-range rather than a count restatement.
8. **3.2 — Pick one of two product names** for the home hero. Don't let "History 365" and "Istorija Srbije 365" share 80 vertical pixels.
9. **3.6 — Home era timeline bands should link to course-page anchors**, not into placeholder lessons.
10. **4.1 — Drop the "Počni od Dana 001 →" link** from the course page header. The progress card below it is state-aware and does the right thing already.
11. **5.6 — Single-row LessonContextHeader on scroll** (or collapse the meta row entirely on mobile lesson page).
12. **5.3 — Add Section to breadcrumbs** (or replace Era with Section — Section is the more useful editorial level).

### Nice to have later
13. **4.3 — Hide JumpToDay until ≥30 authored lessons** justify a fast-jump utility.
14. **4.4 — Eras on course page: collapse section-accordion blocks** behind a "Vidi N odeljaka" disclosure, so the 8 era descriptions read as 8 editorial blocks first.
15. **7 — Add a "Today's lesson by date" component** on home to support the daily-habit promise.
16. **7 — Add a "sample lesson preview" affordance** near the hero CTA so the user can read without committing.
17. **Hero backdrop QA pass** at 360/768/1280/1920 — see if the multiply-blend image holds up at all four. If not, fallback to the pure-CSS wash.
18. **3.3 — Drop the "365 lekcija · oko 8 min dnevno" meta** under the hero CTA or replace with the missing trust line.
19. **CourseProgress card empty state** — suppress the SLEDEĆE row for `hasStarted === false` so the page has one clear "start here" instead of two parallel ones.

---

## 10. Recommended Next Implementation Pass

> **Superseded — see [`docs/PHASE_7_0_PLAN.md`](./PHASE_7_0_PLAN.md).**
>
> The original recommendation in this section was partly driven by the current
> dev-state placeholder ratio (6 of 365 lessons authored). After scope
> clarification on 2026-05-15, lesson content is owned by a separate
> content-generation / editorial workflow and **production will not ship until
> all 365 lessons are complete**. Items in this audit motivated primarily by
> "many lessons are placeholders right now" (notably 5.4) are therefore
> deferred to that workflow, not to the next UI phase.
>
> The Phase 7.0 plan now scopes the next pass to **UI / UX polish that
> survives full content** — clarity, premium feel, redundant chrome, navigation
> flow, trust signal. The audit findings above stand as observations; the plan
> picks the subset that still matters when every day has a real lesson.

---

*End of audit.*
