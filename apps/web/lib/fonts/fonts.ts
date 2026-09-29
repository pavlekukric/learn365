import localFont from 'next/font/local';

/**
 * Self-hosted fonts (review 2026-09-30, item 13). `files/` holds the exact
 * woff2 files `next/font/google` used to download on every build (Google
 * Fonts, OFL — licences beside them), so a build no longer touches the
 * network and the bytes a reader downloads do not change.
 *
 * Google splits every face into unicode-range subsets; Serbian Latin needs
 * two of them — `latin` and `latin-ext` (č ć đ š ž). `next/font/local`
 * applies `declarations` to a whole call, so each family is two calls, one
 * per subset, that declare the same `font-family` name: the browser sees one
 * family and fetches a subset file only for the characters a page uses —
 * the same @font-face set Google's CSS produced, with the same family names
 * ("Spectral", "Inter", "JetBrains Mono") and `display: swap`.
 *
 * Only the `latin` call carries the metric-adjusted fallback face and the
 * public CSS variable; the `latin-ext` call's variable (`--font-*-ext`) is
 * unused and only keeps its @font-face rules in the stylesheet.
 *
 * The unicode ranges are Google's `latin` / `latin-ext` ranges, repeated per
 * call because font loader options must be literals.
 */

// Spectral: roman 300 (lede) / 400 / 500 and italic 400 / 500 (the brand
// mark, upcoming-lesson rows). Italic 300 was never used and is gone.
const spectralLatin = localFont({
  src: [
    { path: './files/spectral-normal-300-latin.woff2', weight: '300', style: 'normal' },
    { path: './files/spectral-normal-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './files/spectral-normal-500-latin.woff2', weight: '500', style: 'normal' },
    { path: './files/spectral-italic-400-latin.woff2', weight: '400', style: 'italic' },
    { path: './files/spectral-italic-500-latin.woff2', weight: '500', style: 'italic' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Spectral' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-spectral',
  adjustFontFallback: 'Times New Roman',
  preload: true,
});

const spectralLatinExt = localFont({
  src: [
    { path: './files/spectral-normal-300-latin-ext.woff2', weight: '300', style: 'normal' },
    { path: './files/spectral-normal-400-latin-ext.woff2', weight: '400', style: 'normal' },
    { path: './files/spectral-normal-500-latin-ext.woff2', weight: '500', style: 'normal' },
    { path: './files/spectral-italic-400-latin-ext.woff2', weight: '400', style: 'italic' },
    { path: './files/spectral-italic-500-latin-ext.woff2', weight: '500', style: 'italic' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Spectral' },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
  display: 'swap',
  variable: '--font-spectral-ext',
  adjustFontFallback: false,
  preload: true,
});

// Inter and JetBrains Mono: one variable-weight file serves 400 and 500.
const interLatin = localFont({
  src: [
    { path: './files/inter-latin.woff2', weight: '400', style: 'normal' },
    { path: './files/inter-latin.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Inter' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: 'Arial',
  preload: true,
});

const interLatinExt = localFont({
  src: [
    { path: './files/inter-latin-ext.woff2', weight: '400', style: 'normal' },
    { path: './files/inter-latin-ext.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Inter' },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
  display: 'swap',
  variable: '--font-inter-ext',
  adjustFontFallback: false,
  preload: true,
});

// Mono is small print (day numbers, minutes): not preloaded, as before.
const jetbrainsMonoLatin = localFont({
  src: [
    { path: './files/jetbrains-mono-latin.woff2', weight: '400', style: 'normal' },
    { path: './files/jetbrains-mono-latin.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'JetBrains Mono' },
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  adjustFontFallback: 'Arial',
  preload: false,
});

const jetbrainsMonoLatinExt = localFont({
  src: [
    { path: './files/jetbrains-mono-latin-ext.woff2', weight: '400', style: 'normal' },
    { path: './files/jetbrains-mono-latin-ext.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'JetBrains Mono' },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
  display: 'swap',
  variable: '--font-jetbrains-mono-ext',
  adjustFontFallback: false,
  preload: false,
});

export const fontVariableClassName = [
  spectralLatin.variable,
  spectralLatinExt.variable,
  interLatin.variable,
  interLatinExt.variable,
  jetbrainsMonoLatin.variable,
  jetbrainsMonoLatinExt.variable,
].join(' ');
