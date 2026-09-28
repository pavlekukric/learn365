/**
 * The one place a day number becomes text (review P2 item 14). Three
 * registers, and nothing else:
 *
 *   padDay(1)            → "001"      the numeral cell — sidebar rows, "Dan 001 / 365"
 *   formatDayEyebrow(1)  → "DAN 001"  mono eyebrows on cards and links
 *   formatDayProse(1)    → "Dan 1"    sentences and metadata ("Dan 1: Lepenski Vir")
 *
 * plus the two compositions built from them. "D001" is retired.
 */
export function padDay(day: number): string {
  return String(day).padStart(3, '0');
}

export function formatDayEyebrow(day: number): string {
  return `DAN ${padDay(day)}`;
}

/** A section's span, e.g. "DAN 001–005". */
export function formatDayRange(start: number, end: number): string {
  return `DAN ${padDay(start)}–${padDay(end)}`;
}

export function formatDayProse(day: number): string {
  return `Dan ${String(day)}`;
}

/**
 * The daily-ritual eyebrow, "Tvoj N. dan". N is the day of the lesson the
 * reader is about to open (the resume lesson), so the anchor above a card
 * and the "DAN nnn" on the card always tell one story.
 */
export function formatJourneyDay(day: number): string {
  return `Tvoj ${String(day)}. dan`;
}
