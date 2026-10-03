/**
 * „Prijavi grešku" under every lesson (review 2026-10-03 P1 4): a plain
 * `mailto:` with the day in the subject and the lesson's URL in the body, so
 * a report names the lesson without the reader having to.
 *
 * The address is the owner's to choose, so it is a build-time setting,
 * `NEXT_PUBLIC_REPORT_EMAIL` (DEPLOY.md §5). Unset or empty → no link at all;
 * the lesson pages are prerendered, so the value is baked in at `next build`.
 */

/** The configured address, or `null` when the link should not render. */
export function reportErrorEmail(
  raw: string | undefined = process.env.NEXT_PUBLIC_REPORT_EMAIL,
): string | null {
  const email = raw?.trim() ?? '';
  // A bare sanity check, not validation: one `@`, something on each side, no
  // characters that would break out of the mailto's address part.
  return /^[^\s@?&#]+@[^\s@?&#]+$/.test(email) ? email : null;
}

interface ReportErrorMail {
  readonly email: string;
  readonly dayNumber: number;
  /** Absolute URL of the lesson. */
  readonly lessonUrl: string;
}

/** `mailto:` for one lesson: subject „Greška u lekciji — Dan NNN", URL in the body. */
export function reportErrorHref({ email, dayNumber, lessonUrl }: ReportErrorMail): string {
  const day = String(dayNumber).padStart(3, '0');
  const subject = `Greška u lekciji — Dan ${day}`;
  const body = `Lekcija: ${lessonUrl}\n\nŠta treba ispraviti:\n`;
  // encodeURIComponent, not URLSearchParams: mail clients read `+` as a
  // literal plus, so spaces must be `%20` (RFC 6068).
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
