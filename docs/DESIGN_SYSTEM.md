# Design System

The design system extracted from Cloud Design V1 (`design/cloud-design-v1/`) and codified for the production app.

**v1 ships only the Editorial direction.** No user-facing theme toggle. The Modern direction stays in the codebase for future reference and developer experimentation.

---

## 1. Source of truth

- Visual reference: `design/cloud-design-v1/styles.css` and the JSX prototype files.
- Production tokens: `packages/ui/src/tokens` (TS).
- Generated CSS: `packages/ui/dist/globals.css` (built from the TS tokens, imported by `apps/web/app/globals.css`).
- The CSS in `design/cloud-design-v1/styles.css` is reference. The production CSS is generated from typed tokens — do not edit by hand.

---

## 2. Themes

### Editorial (v1 default, the only direction exposed)

- Warm cream parchment background, very low chroma.
- Spectral serif for display and body.
- Inter for sans (nav, buttons, metadata labels).
- JetBrains Mono for counters, day numbers, eyebrows.
- Evergreen accent (low-chroma green).
- Hairline rules; ornamental flourish dividers; dropcap on first paragraph.

### Modern *(future / dev only)*

- Higher-contrast off-white background.
- Sans-serif headings (Inter weights).
- No dropcap on first paragraph, no flourishes.
- Same accent.
- Retained in the codebase as a `data-direction="B"` override; not exposed by any UI element in v1.

Switching mechanism (kept from the prototype): `data-direction` attribute on `<html>`. v1 always sets `A`. The Modern bundle's CSS exists but is unreachable from the product UI.

---

## 3. Color tokens

OKLCH-authored. Each token name maps 1:1 to a CSS variable.

| Token | Editorial | Purpose |
|---|---|---|
| `bg` | `oklch(0.962 0.012 85)` | Page background — warm cream |
| `surface` | `oklch(0.985 0.008 85)` | Cards, raised surfaces |
| `surface2` | `oklch(0.945 0.014 82)` | Alternate rows, hover wash |
| `ink` | `oklch(0.22 0.012 60)` | Primary text |
| `ink2` | `oklch(0.36 0.012 60)` | Secondary text |
| `muted` | `oklch(0.52 0.010 60)` | Meta / nav / muted labels |
| `faint` | `oklch(0.68 0.010 60)` | Tertiary / placeholder |
| `rule` | `oklch(0.86 0.014 78)` | Hairlines |
| `rule2` | `oklch(0.78 0.018 78)` | Heavier dividers, ghost button border |
| `accent` | `oklch(0.36 0.060 155)` | Evergreen accent |
| `accentInk` | `oklch(0.24 0.050 155)` | Active text on accent surfaces |
| `accentSoft` | `oklch(0.88 0.030 155)` | Soft accent tint |
| `completed` | `oklch(0.46 0.085 150)` | Completion check fill |

### sRGB fallbacks

A `@supports not (color: oklch(0 0 0))` block ships sRGB equivalents for `bg`, `ink`, `accent`, `completed`, `rule` so older Android WebViews don't fall apart. Other tokens degrade to `currentColor`/inheritance.

### Selection

```
::selection { background: var(--accent); color: var(--bg); }
```

---

## 4. Typography

### Font stacks

```
--serif: "Spectral", "Source Serif 4", Georgia, "Times New Roman", serif;
--sans:  "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--mono:  "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

### Scale

| Token | Font | Size | Line height | Letter spacing | Weight | Use |
|---|---|---|---|---|---|---|
| `display` | serif | clamp(56, 7.2vw, 104) px | 1.04 | -0.015em | 400 | Home hero |
| `h1` | serif | 48 px | 1.08 | -0.018em | 400 | Course overview heading |
| `readerTitle` | serif | 44 px | 1.08 | -0.018em | 400 | Lesson title |
| `h2` | serif | 32 px | 1.15 | -0.012em | 400 | Section headings |
| `readerH2` | serif | 26 px | 1.25 | -0.008em | 500 | Inline lesson headings |
| `h3` | serif | 22 px | 1.25 | -0.008em | 500 | Card titles |
| `lede` | serif | 20 px | 1.55 | — | 300 | Subtitles, leading copy |
| `body` | serif | 18 px | 1.72 | — | 400 | Lesson paragraphs |
| `small` | serif | 13 px | 1.5 | — | 400 | Descriptions |
| `tiny` | sans | 11.5 px | 1.4 | 0.02em | 400 | Meta lines |
| `eyebrow` | sans | 11 px | 1.2 | 0.14em, uppercase | 500 | Section labels |
| `mono` | mono | 10.5–12 px | 1.3 | 0.06–0.10em | 400/500 | Counters, day numbers, year stamps |

### Mobile overrides

Below 860px:
- `readerTitle` → 30 px
- `body` → 17 px
- `display` keeps the `clamp` lower bound

### Dropcap

First paragraph of every lesson body gets a serif dropcap, 64 px, line-height 0.9, evergreen accent color, padded right. Disabled when `prefers-reduced-motion: reduce` is set? No — the dropcap is static, no motion concern; it stays on. It is only suppressed in the Modern direction.

Mobile dropcap: same scale, but tested per device — may fall back to a regular first paragraph if rendering is fragile in WebView.

### Tabular nums

Every counter (`x / 365`, day numbers, percentages) renders with `font-variant-numeric: tabular-nums`.

---

## 5. Spacing

8-px base grid, with 4-px refinements where the prototype demands them.

| Token | Value |
|---|---|
| `space.0` | 0 |
| `space.1` | 4 px |
| `space.2` | 8 px |
| `space.3` | 12 px |
| `space.4` | 16 px |
| `space.5` | 20 px |
| `space.6` | 24 px |
| `space.7` | 28 px |
| `space.8` | 32 px |
| `space.9` | 40 px |
| `space.10` | 48 px |
| `space.11` | 56 px |
| `space.12` | 64 px |
| `space.13` | 80 px |
| `space.14` | 96 px |
| `space.15` | 120 px |

Semantic aliases:

| Token | Value |
|---|---|
| `readingColMax` | 660 px |
| `shellMax` | 1440 px |
| `sidebarWidth` | 320 px |
| `topbarHeight` | 64 px |

---

## 6. Radii

| Token | Value |
|---|---|
| `radii.sm` | 4 px |
| `radii.md` | 6 px |
| `radii.lg` | 10 px |
| `radii.xl` | 16 px |
| `radii.pill` | 999 px |

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `easing.editorial` | `cubic-bezier(.2, .7, .2, 1)` | All transitions |
| `duration.fast` | 120 ms | Hover state changes |
| `duration.base` | 150 ms | Default UI transitions |
| `duration.medium` | 350 ms | Progress bar / ring fills, timeline marker |
| `duration.slow` | 400 ms | Drawer slide-in |

### Reduced motion

Global rule (kept from prototype):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

The timeline marker, drawer, and progress bar all degrade to instant changes when reduced motion is requested.

---

## 8. Elevation

| Token | Value | Use |
|---|---|---|
| `elevation.none` | none | Default |
| `elevation.card` | `0 1px 0 0 var(--rule)` (essentially a hairline) | Standard card |
| `elevation.floating` | `0 16px 40px -20px rgba(40, 30, 10, 0.25)` | Home floating "current lesson" card |
| `elevation.drawer` | `12px 0 40px -10px rgba(0, 0, 0, 0.2)` | Mobile drawer |

Shadows use warm rgba (not neutral black) to match parchment tone.

---

## 9. Iconography

All icons live in `packages/ui-web/src/icons` as inline SVG React components. No icon font. Each icon:

- Uses `viewBox` aligned to a 12–16 px grid.
- Uses `stroke="currentColor"` with `strokeWidth` 1.4–1.8.
- Accepts standard SVG props for size/color.

v1 icon set: `IconCheck`, `IconChev`, `IconArrow`, `IconArrowLeft`, `IconMenu`, `IconClose`.

---

## 10. Decorative elements

- **Flourish** — centered serif glyph (`✦`) flanked by two hairlines. Used between hero and "how it works" on Home, between subtitle and body in Lesson reader. Suppressed in Modern direction.
- **Hairline rules** — `1px solid var(--rule)` separators. Never thicker than 1px unless calling out heavier sections (`rule2`).
- **Dot grid placeholders** — `repeating-linear-gradient` 135° at 8 px pitch, plus a label chip. Used wherever image content is not yet authored.

---

## 11. Layout primitives

- **Shell** — `max-width: var(--shell-max)`, horizontal padding 40 px desktop / 20 px mobile, auto-centered.
- **Reading column** — `max-width: 660 px`, centered inside the reader main, with vertical padding of 56 / 120 px on desktop and 24 / 80 px on mobile.
- **Sidebar** — fixed 320 px, sticky at `top: 64px`, full-height with thin scrollbar styling.
- **Top bar** — 64 px height, sticky, translucent with `backdrop-filter: blur(14px)` and `saturate(160%)`.

---

## 12. Component states

Cross-cutting state rules every component must honor:

- **Hover** — subtle background wash (`color-mix(in oklch, var(--ink) 4%, transparent)`) on interactive rows; arrow translates 2 px right on buttons with arrow icons.
- **Active** (lesson selected) — accent-tinted background plus a 2-px accent vertical bar at the left edge.
- **Focus-visible** — 2-px outline using `var(--accent)`, 2-px offset. Never rely on hover-only states.
- **Disabled** — opacity 0.4, `cursor: not-allowed`, no hover effect.
- **Completed** — green-filled dot with check icon; lesson title color shifts to `muted`; day number shifts to `completed` color.

---

## 13. Density

The prototype exposed `compact / comfortable / spacious` density modes. **v1 ships `comfortable` only.** Compact and spacious remain in the token set as data attributes (`data-density`) but no UI exposes them.

---

## 14. Accessibility minimums

- All interactive elements have a visible focus state.
- Color is never the only signal — completion uses dot + checkmark + text; active uses bar + background.
- Touch targets at mobile width are ≥ 44 × 44 px.
- All text passes WCAG AA contrast against its background. Spot-check tokens: `ink` on `bg`, `ink2` on `bg`, `muted` on `bg`, `accent` on `bg`, `bg` on `accent`.
- `:focus-visible` outlines are 2 px and offset 2 px; never `outline: none` without a replacement.
- Form controls and buttons carry accessible labels (`aria-label` when only an icon is visible).

---

## 15. Token-to-CSS pipeline

```
packages/ui/src/tokens/*.ts
        │ (build step: emit-globals.ts)
        ▼
packages/ui/dist/globals.css     # :root { --bg: …; … }  + base classes
        │ (consumer import)
        ▼
apps/web/app/globals.css         # @import '@learn365/ui/globals.css';
```

The emitter also emits `packages/ui/dist/tokens.ts` for mobile consumption (RN does not consume CSS vars).

---

## 16. What lives where

| Concern | Location |
|---|---|
| Color/typo/space/etc. tokens | `packages/ui/src/tokens` |
| Theme bundles (Editorial, Modern) | `packages/ui/src/themes` |
| Generated CSS variables | `packages/ui/dist/globals.css` |
| Component styles | `packages/ui-web/src/<Component>/<Component>.module.css` |
| Base typography classes (`.display`, `.h1`, `.body`, `.eyebrow`, etc.) | `packages/ui/dist/globals.css` |
| Layout shell + reset | `apps/web/app/globals.css` |
