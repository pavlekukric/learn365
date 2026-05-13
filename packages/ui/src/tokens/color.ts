/**
 * OKLCH-authored color tokens. Names map 1:1 to CSS variables emitted
 * by `scripts/emit-globals.ts`.
 *
 * Editorial values are the v1 product palette (the only one exposed at
 * runtime). Modern overrides are retained for the `data-direction="B"`
 * dev-only reference; no UI exposes them.
 *
 * sRGB fallbacks for critical tokens are emitted by the generator into a
 * `@supports not (color: oklch(0 0 0))` block. Token names listed in
 * `SRGB_FALLBACK_TOKENS` get a fallback; everything else degrades via
 * `currentColor` / inheritance.
 */

export interface ColorTokens {
  readonly bg: string;
  readonly surface: string;
  readonly surface2: string;
  readonly ink: string;
  readonly ink2: string;
  readonly muted: string;
  readonly faint: string;
  readonly rule: string;
  readonly rule2: string;
  readonly accent: string;
  readonly accentInk: string;
  readonly accentSoft: string;
  readonly completed: string;
}

export const editorialColors: ColorTokens = {
  bg: 'oklch(0.962 0.012 85)',
  surface: 'oklch(0.985 0.008 85)',
  surface2: 'oklch(0.945 0.014 82)',
  ink: 'oklch(0.22 0.012 60)',
  ink2: 'oklch(0.36 0.012 60)',
  muted: 'oklch(0.52 0.010 60)',
  faint: 'oklch(0.68 0.010 60)',
  rule: 'oklch(0.86 0.014 78)',
  rule2: 'oklch(0.78 0.018 78)',
  accent: 'oklch(0.36 0.060 155)',
  accentInk: 'oklch(0.24 0.050 155)',
  accentSoft: 'oklch(0.88 0.030 155)',
  completed: 'oklch(0.46 0.085 150)',
};

/**
 * Modern overrides; applied on top of `editorialColors` for `data-direction="B"`.
 * Not exposed by any v1 UI surface.
 */
export const modernColorOverrides: Partial<ColorTokens> = {
  bg: 'oklch(0.988 0.004 90)',
  surface: 'oklch(1 0 0)',
  surface2: 'oklch(0.972 0.006 90)',
  rule: 'oklch(0.90 0.006 90)',
  rule2: 'oklch(0.82 0.008 90)',
  ink: 'oklch(0.18 0.010 60)',
  ink2: 'oklch(0.32 0.010 60)',
};

/**
 * sRGB equivalents for the critical tokens, used only when the browser
 * does not support `oklch()`. Values are hand-picked perceptual matches.
 */
export const srgbFallback: Partial<ColorTokens> = {
  bg: '#f5efe3',
  ink: '#28231b',
  rule: '#d9d1c2',
  accent: '#3d6650',
  completed: '#4e8868',
};

/** CSS variable name for each color token. */
export const colorVarName: Record<keyof ColorTokens, string> = {
  bg: '--bg',
  surface: '--surface',
  surface2: '--surface-2',
  ink: '--ink',
  ink2: '--ink-2',
  muted: '--muted',
  faint: '--faint',
  rule: '--rule',
  rule2: '--rule-2',
  accent: '--accent',
  accentInk: '--accent-ink',
  accentSoft: '--accent-soft',
  completed: '--completed',
};
