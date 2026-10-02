import localFont from 'next/font/local';

/**
 * Self-hosted fonts (review 2026-09-30 item 13; reworked by review
 * 2026-10-01 P1 item 3).
 *
 * One file per face, subset to Serbian Latin (`scripts/fonts/subset-fonts.sh`
 * builds them from the google/fonts sources, same versions Google served):
 * Basic Latin + Latin-1, č ć đ š ž, the few foreign letters the lessons use
 * (ă ğ ı ş ș ț), typographic punctuation („ ” – — …), arrows and ≤ ≥. Before,
 * every face was Google's `latin` + `latin-ext` pair, and a Serbian page
 * needed both: 12 files, about 295 kB, all preloaded.
 *
 * Preload is per `localFont` call, so a family is split into the face the
 * first paint needs (preloaded) and the rest (fetched when a rule uses them).
 * Every call declares the same `font-family` name, so the browser sees one
 * family. Only the preloaded call carries the metric-adjusted fallback face
 * and the public CSS variable (`globals.css`); the other calls' variables
 * (`--font-*-rest`) are unused and only keep their @font-face rules.
 *
 * Preloaded: Spectral 400 (body text, headings) and Inter (one variable file
 * for 400–500: UI). Not preloaded: Spectral 300 (lede), 500 and the italics
 * (the brand mark, upcoming-lesson rows), JetBrains Mono (small print).
 * `scripts/bundle-size.mjs` fails the build when more than these two are
 * preloaded or their size grows past the budget.
 *
 * The unicode-range is SERBIAN_LATIN_RANGE (`serbianLatin.ts`), repeated per
 * call because font loader options must be literals; `fonts.test.ts` keeps
 * the copies identical and the lesson text inside the range.
 */

const spectral = localFont({
  src: [{ path: './files/spectral-normal-400.woff2', weight: '400', style: 'normal' }],
  declarations: [
    { prop: 'font-family', value: 'Spectral' },
    {
      prop: 'unicode-range',
      value:
        'U+0020-007E, U+00A0-00FF, U+0102-0103, U+0106-0107, U+010C-010D, U+0110-0111, U+011E-011F, U+0130-0131, U+0152-0153, U+015E-0161, U+017D-017E, U+0218-021B, U+02BB-02BC, U+02BF, U+02C6, U+02DA, U+02DC, U+0300-0308, U+030C, U+2010-2027, U+202F-203A, U+20AC, U+2122, U+2190-2193, U+2212, U+2248, U+2260, U+2264-2265, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-spectral',
  adjustFontFallback: 'Times New Roman',
  preload: true,
});

const spectralRest = localFont({
  src: [
    { path: './files/spectral-normal-300.woff2', weight: '300', style: 'normal' },
    { path: './files/spectral-normal-500.woff2', weight: '500', style: 'normal' },
    { path: './files/spectral-italic-400.woff2', weight: '400', style: 'italic' },
    { path: './files/spectral-italic-500.woff2', weight: '500', style: 'italic' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Spectral' },
    {
      prop: 'unicode-range',
      value:
        'U+0020-007E, U+00A0-00FF, U+0102-0103, U+0106-0107, U+010C-010D, U+0110-0111, U+011E-011F, U+0130-0131, U+0152-0153, U+015E-0161, U+017D-017E, U+0218-021B, U+02BB-02BC, U+02BF, U+02C6, U+02DA, U+02DC, U+0300-0308, U+030C, U+2010-2027, U+202F-203A, U+20AC, U+2122, U+2190-2193, U+2212, U+2248, U+2260, U+2264-2265, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-spectral-rest',
  adjustFontFallback: false,
  preload: false,
});

// Inter and JetBrains Mono: one variable-weight file (cut to 400–500) serves
// both weights.
const inter = localFont({
  src: [
    { path: './files/inter.woff2', weight: '400', style: 'normal' },
    { path: './files/inter.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'Inter' },
    {
      prop: 'unicode-range',
      value:
        'U+0020-007E, U+00A0-00FF, U+0102-0103, U+0106-0107, U+010C-010D, U+0110-0111, U+011E-011F, U+0130-0131, U+0152-0153, U+015E-0161, U+017D-017E, U+0218-021B, U+02BB-02BC, U+02BF, U+02C6, U+02DA, U+02DC, U+0300-0308, U+030C, U+2010-2027, U+202F-203A, U+20AC, U+2122, U+2190-2193, U+2212, U+2248, U+2260, U+2264-2265, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: 'Arial',
  preload: true,
});

const jetbrainsMono = localFont({
  src: [
    { path: './files/jetbrains-mono.woff2', weight: '400', style: 'normal' },
    { path: './files/jetbrains-mono.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'font-family', value: 'JetBrains Mono' },
    {
      prop: 'unicode-range',
      value:
        'U+0020-007E, U+00A0-00FF, U+0102-0103, U+0106-0107, U+010C-010D, U+0110-0111, U+011E-011F, U+0130-0131, U+0152-0153, U+015E-0161, U+017D-017E, U+0218-021B, U+02BB-02BC, U+02BF, U+02C6, U+02DA, U+02DC, U+0300-0308, U+030C, U+2010-2027, U+202F-203A, U+20AC, U+2122, U+2190-2193, U+2212, U+2248, U+2260, U+2264-2265, U+FEFF, U+FFFD',
    },
  ],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  adjustFontFallback: 'Arial',
  preload: false,
});

export const fontVariableClassName = [
  spectral.variable,
  spectralRest.variable,
  inter.variable,
  jetbrainsMono.variable,
].join(' ');
