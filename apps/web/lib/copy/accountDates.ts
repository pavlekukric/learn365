/**
 * Dates on the owner's accounts overview, in the reader's language and in
 * Belgrade time. Month names are spelled here rather than asked of the
 * runtime's locale data, so the page reads the same on every Node build.
 */
const TIME_ZONE = 'Europe/Belgrade';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
const DAY_MS = 86_400_000;

interface CalendarDay {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const partsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function calendarDay(date: Date): CalendarDay {
  const parts = partsFormat.formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  return { year: read('year'), month: read('month'), day: read('day') };
}

function dayNumber({ year, month, day }: CalendarDay): number {
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

/** `27. sep 2026.` */
export function formatAccountDate(date: Date): string {
  const { year, month, day } = calendarDay(date);
  return `${String(day)}. ${MONTHS[month - 1] ?? ''} ${String(year)}.`;
}

/** `danas`, `juče`, `pre 3 dana` within a week; the date after that. */
export function formatLastActivity(date: Date, now: Date = new Date()): string {
  const days = dayNumber(calendarDay(now)) - dayNumber(calendarDay(date));
  if (days <= 0) return 'danas';
  if (days === 1) return 'juče';
  if (days < 7) return `pre ${String(days)} dana`;
  return formatAccountDate(date);
}
