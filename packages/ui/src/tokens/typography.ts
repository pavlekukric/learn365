/**
 * Font stacks (emitted as CSS variables) plus the type scale (emitted
 * as base classes: `.display`, `.h1`, `.body`, etc.).
 *
 * Mobile overrides under 860px live in this file too — the generator
 * emits a matching `@media (max-width: 860px)` block.
 */

export interface FontStacks {
  readonly serif: string;
  readonly sans: string;
  readonly mono: string;
}

export const fontStacks: FontStacks = {
  serif: '"Spectral", "Source Serif 4", Georgia, "Times New Roman", serif',
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
};

export type FontFamily = keyof FontStacks;
export type ColorRole = 'ink' | 'ink2' | 'muted' | 'faint' | 'accent';

export interface TypeStyle {
  readonly family: FontFamily;
  readonly size: string;
  readonly lineHeight: number | string;
  readonly letterSpacing?: string;
  readonly weight: number;
  readonly color?: ColorRole;
  readonly uppercase?: boolean;
  readonly italic?: boolean;
  /** Optional override for screens narrower than 860px. */
  readonly mobile?: Partial<Pick<TypeStyle, 'size' | 'lineHeight'>>;
}

export interface TypeScale {
  readonly display: TypeStyle;
  readonly h1: TypeStyle;
  readonly readerTitle: TypeStyle;
  readonly h2: TypeStyle;
  readonly readerH2: TypeStyle;
  readonly h3: TypeStyle;
  readonly lede: TypeStyle;
  readonly body: TypeStyle;
  readonly small: TypeStyle;
  readonly tiny: TypeStyle;
  readonly eyebrow: TypeStyle;
  readonly mono: TypeStyle;
}

export const typeScale: TypeScale = {
  display: {
    family: 'serif',
    size: 'clamp(56px, 7.2vw, 104px)',
    lineHeight: 1.04,
    letterSpacing: '-0.015em',
    weight: 400,
    color: 'ink',
    mobile: { size: 'clamp(38px, 10.5vw, 52px)', lineHeight: 1.08 },
  },
  h1: {
    family: 'serif',
    size: '48px',
    lineHeight: 1.08,
    letterSpacing: '-0.018em',
    weight: 400,
    color: 'ink',
    mobile: { size: '33px', lineHeight: 1.12 },
  },
  readerTitle: {
    family: 'serif',
    size: '44px',
    lineHeight: 1.08,
    letterSpacing: '-0.018em',
    weight: 400,
    color: 'ink',
    mobile: { size: '30px' },
  },
  h2: {
    family: 'serif',
    size: '32px',
    lineHeight: 1.15,
    letterSpacing: '-0.012em',
    weight: 400,
    color: 'ink',
    mobile: { size: '25px', lineHeight: 1.2 },
  },
  readerH2: {
    family: 'serif',
    size: '26px',
    lineHeight: 1.25,
    letterSpacing: '-0.008em',
    weight: 500,
    color: 'ink',
    mobile: { size: '22px' },
  },
  h3: {
    family: 'serif',
    size: '22px',
    lineHeight: 1.25,
    letterSpacing: '-0.008em',
    weight: 500,
    color: 'ink',
  },
  lede: {
    family: 'serif',
    size: '20px',
    lineHeight: 1.55,
    weight: 300,
    color: 'ink2',
    mobile: { size: '18px', lineHeight: 1.5 },
  },
  body: {
    family: 'serif',
    size: '18px',
    lineHeight: 1.72,
    weight: 400,
    color: 'ink',
    mobile: { size: '17px' },
  },
  small: {
    family: 'serif',
    size: '13px',
    lineHeight: 1.5,
    weight: 400,
    color: 'ink2',
  },
  tiny: {
    family: 'sans',
    size: '11.5px',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
    weight: 400,
    color: 'muted',
  },
  eyebrow: {
    family: 'sans',
    size: '11px',
    lineHeight: 1.2,
    letterSpacing: '0.14em',
    weight: 500,
    color: 'muted',
    uppercase: true,
  },
  mono: {
    family: 'mono',
    size: '11px',
    lineHeight: 1.3,
    letterSpacing: '0.06em',
    weight: 400,
    color: 'muted',
  },
};
