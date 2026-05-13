/**
 * Emits `dist/globals.css` (CSS variables + base typography classes)
 * and `dist/tokens.ts` (a frozen-const snapshot of the editorial theme
 * for mobile / RN consumption that cannot read CSS variables).
 *
 * Run via `pnpm --filter @learn365/ui build`.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  colorVarName,
  elevationVarName,
  layoutVarName,
  motionVarName,
  radiiVarName,
  spaceVarName,
  srgbFallback,
  type ColorRole,
  type ColorTokens,
  type TypeScale,
  type TypeStyle,
} from '../src/tokens/index.js';
import { editorial } from '../src/themes/editorial.js';
import { modern } from '../src/themes/modern.js';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');
mkdirSync(distDir, { recursive: true });

const COLOR_VAR_BY_ROLE: Record<ColorRole, string> = {
  ink: colorVarName.ink,
  ink2: colorVarName.ink2,
  muted: colorVarName.muted,
  faint: colorVarName.faint,
  accent: colorVarName.accent,
};

/** typeScale keys that get an emitted CSS class. `mono` is excluded so
 * the `.mono` font-family class (set elsewhere) stays unambiguous. */
const TYPESCALE_CLASS_KEYS: readonly (keyof TypeScale)[] = [
  'display',
  'h1',
  'readerTitle',
  'h2',
  'readerH2',
  'h3',
  'lede',
  'body',
  'small',
  'tiny',
  'eyebrow',
];

function camelToKebab(input: string): string {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function rootVars(): string {
  const lines: string[] = [];

  // Color
  for (const [key, varName] of Object.entries(colorVarName)) {
    const value = editorial.color[key as keyof ColorTokens];
    lines.push(`  ${varName}: ${value};`);
  }

  // Fonts
  lines.push(`  --serif: ${editorial.fonts.serif};`);
  lines.push(`  --sans: ${editorial.fonts.sans};`);
  lines.push(`  --mono: ${editorial.fonts.mono};`);

  // Space
  for (const [key, varName] of Object.entries(spaceVarName)) {
    const value = editorial.space[key as keyof typeof editorial.space];
    lines.push(`  ${varName}: ${value};`);
  }

  // Layout
  for (const [key, varName] of Object.entries(layoutVarName)) {
    const value = editorial.layout[key as keyof typeof editorial.layout];
    lines.push(`  ${varName}: ${value};`);
  }

  // Radii
  for (const [key, varName] of Object.entries(radiiVarName)) {
    const value = editorial.radii[key as keyof typeof editorial.radii];
    lines.push(`  ${varName}: ${value};`);
  }

  // Motion
  for (const [key, varName] of Object.entries(motionVarName)) {
    const value = editorial.motion[key as keyof typeof editorial.motion];
    lines.push(`  ${varName}: ${value};`);
  }

  // Elevation
  for (const [key, varName] of Object.entries(elevationVarName)) {
    const value = editorial.elevation[key as keyof typeof editorial.elevation];
    lines.push(`  ${varName}: ${value};`);
  }

  return `:root {\n${lines.join('\n')}\n}`;
}

function modernOverrides(): string {
  const overrides: string[] = [];
  for (const [key, value] of Object.entries(modern.color)) {
    if (editorial.color[key as keyof ColorTokens] !== value) {
      const varName = colorVarName[key as keyof ColorTokens];
      overrides.push(`  ${varName}: ${value};`);
    }
  }
  if (overrides.length === 0) return '';
  return `[data-direction="B"] {\n${overrides.join('\n')}\n}`;
}

function srgbFallbackBlock(): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(srgbFallback)) {
    if (!value) continue;
    const varName = colorVarName[key as keyof ColorTokens];
    lines.push(`    ${varName}: ${value};`);
  }
  return [
    '@supports not (color: oklch(0 0 0)) {',
    '  :root {',
    ...lines,
    '  }',
    '}',
  ].join('\n');
}

function baseStyles(): string {
  return [
    '* { box-sizing: border-box; }',
    '',
    'html, body {',
    '  margin: 0;',
    '  padding: 0;',
    '  background: var(--bg);',
    '  color: var(--ink);',
    '  font-family: var(--sans);',
    '  font-size: 15px;',
    '  line-height: 1.5;',
    '  -webkit-font-smoothing: antialiased;',
    '  text-rendering: optimizeLegibility;',
    '}',
    '',
    'a { color: inherit; text-decoration: none; }',
    'button { font: inherit; color: inherit; background: transparent; border: 0; cursor: pointer; padding: 0; }',
    '',
    '::selection { background: var(--accent); color: var(--bg); }',
  ].join('\n');
}

function fontFamilyClasses(): string {
  return [
    '.serif { font-family: var(--serif); }',
    '.sans { font-family: var(--sans); }',
    '.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }',
  ].join('\n');
}

function typeStyleDeclarations(style: TypeStyle, indent = '  '): string[] {
  const out: string[] = [];
  out.push(`${indent}font-family: var(--${style.family});`);
  out.push(`${indent}font-weight: ${style.weight};`);
  out.push(`${indent}font-size: ${style.size};`);
  out.push(`${indent}line-height: ${style.lineHeight};`);
  if (style.letterSpacing) out.push(`${indent}letter-spacing: ${style.letterSpacing};`);
  if (style.color) out.push(`${indent}color: var(${COLOR_VAR_BY_ROLE[style.color]});`);
  if (style.uppercase) out.push(`${indent}text-transform: uppercase;`);
  if (style.italic) out.push(`${indent}font-style: italic;`);
  return out;
}

function typeScaleClasses(): string {
  const blocks: string[] = [];
  for (const key of TYPESCALE_CLASS_KEYS) {
    const style = editorial.typeScale[key];
    const cls = `.${camelToKebab(key)}`;
    blocks.push(`${cls} {\n${typeStyleDeclarations(style).join('\n')}\n}`);
  }
  return blocks.join('\n\n');
}

function mobileOverrides(): string {
  const lines: string[] = [];
  for (const key of TYPESCALE_CLASS_KEYS) {
    const style = editorial.typeScale[key];
    if (!style.mobile) continue;
    const cls = `.${camelToKebab(key)}`;
    const inner: string[] = [];
    if (style.mobile.size) inner.push(`    font-size: ${style.mobile.size};`);
    if (style.mobile.lineHeight) inner.push(`    line-height: ${style.mobile.lineHeight};`);
    lines.push(`  ${cls} {\n${inner.join('\n')}\n  }`);
  }
  if (lines.length === 0) return '';
  return ['@media (max-width: 860px) {', ...lines, '}'].join('\n');
}

function reducedMotion(): string {
  return [
    '@media (prefers-reduced-motion: reduce) {',
    '  *, *::before, *::after {',
    '    animation-duration: 0.01ms !important;',
    '    transition-duration: 0.01ms !important;',
    '  }',
    '}',
  ].join('\n');
}

function buildCss(): string {
  return [
    '/* Learn365 design tokens — generated from @learn365/ui. Do not edit by hand. */',
    '/* Source: packages/ui/src/{tokens,themes}/  →  scripts/emit-globals.ts */',
    '',
    rootVars(),
    '',
    modernOverrides(),
    '',
    srgbFallbackBlock(),
    '',
    baseStyles(),
    '',
    fontFamilyClasses(),
    '',
    typeScaleClasses(),
    '',
    mobileOverrides(),
    '',
    reducedMotion(),
    '',
  ].join('\n');
}

function buildTokensModule(): string {
  return [
    '// Generated from @learn365/ui. Do not edit by hand.',
    '// Frozen-const snapshot of the Editorial theme for mobile / RN consumption.',
    '',
    `export const tokens = ${JSON.stringify(editorial, null, 2)} as const;`,
    '',
    'export type Tokens = typeof tokens;',
    '',
  ].join('\n');
}

writeFileSync(resolve(distDir, 'globals.css'), buildCss());
writeFileSync(resolve(distDir, 'tokens.ts'), buildTokensModule());

console.log(`@learn365/ui: wrote dist/globals.css and dist/tokens.ts`);
