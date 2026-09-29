/** Search engines show roughly 155–160 characters of a meta description. */
export const META_DESCRIPTION_MAX = 155;

/**
 * A meta description of at most `max` characters: the text as-is when it
 * fits, otherwise cut at the last word boundary that leaves room for "…",
 * with dangling punctuation dropped before the ellipsis. Whitespace runs
 * collapse to one space first. A single word longer than the limit is cut
 * hard — it cannot happen with lesson summaries, but the result must still
 * respect the limit.
 */
export function truncateDescription(text: string, max: number = META_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(' ');
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.!?—–-]+$/u, '')}…`;
}
