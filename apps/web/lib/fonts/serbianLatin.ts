/**
 * The characters the self-hosted font files cover (`fonts.ts`,
 * `scripts/fonts/subset-fonts.sh`): Serbian Latin plus what the lessons
 * quote. Plain data so a test can check it; `fonts.ts` repeats the literal.
 */
export const SERBIAN_LATIN_RANGE =
  'U+0020-007E, U+00A0-00FF, U+0102-0103, U+0106-0107, U+010C-010D, U+0110-0111, U+011E-011F, U+0130-0131, U+0152-0153, U+015E-0161, U+017D-017E, U+0218-021B, U+02BB-02BC, U+02BF, U+02C6, U+02DA, U+02DC, U+0300-0308, U+030C, U+2010-2027, U+202F-203A, U+20AC, U+2122, U+2190-2193, U+2212, U+2248, U+2260, U+2264-2265, U+FEFF, U+FFFD';

/** `true` when `codePoint` falls inside a unicode-range list like the one above. */
export function inUnicodeRange(range: string, codePoint: number): boolean {
  return range.split(',').some((part) => {
    const [from = '', to = from] = part.trim().replace(/^U\+/, '').split('-');
    return codePoint >= parseInt(from, 16) && codePoint <= parseInt(to, 16);
  });
}
