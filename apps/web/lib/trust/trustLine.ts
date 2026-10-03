/**
 * The one quiet line under every lesson (review 2026-10-03 P1 4): how the
 * text was made and when its facts were checked, with links to the reading
 * list and — when an address is configured — the error report.
 *
 * Strictly what `docs/review/` records: an AI-prepared, hand-edited text; a
 * fact check of all 365 lessons (2026-09-30) and a second-source pass of the
 * disputed places (2026-10-01). No reviewer is named because there is none
 * yet; a named reviewer goes in the lesson's own `byline` + `lastReviewedAt`.
 */

import type { LessonTrustLink } from '@learn365/ui-web';

import { readingListHref } from '@/lib/routes';
import { SITE_URL } from '@/lib/seo/metadata';

import { reportErrorEmail, reportErrorHref } from './reportError';

export const TRUST_NOTE = 'AI tekst, ručno uređen. Činjenice proverene u septembru i oktobru 2026.';
export const READING_LIST_LINK_LABEL = 'Literatura i provera';
export const REPORT_ERROR_LINK_LABEL = 'Prijavi grešku';

interface TrustLinksInput {
  readonly courseId: string;
  readonly eraId: string;
  readonly dayNumber: number;
  /** Site path of the lesson; made absolute for the mail body. */
  readonly lessonPath: string;
}

/** The reading-list link (to the lesson's era), then the report link when configured. */
export function lessonTrustLinks({
  courseId,
  eraId,
  dayNumber,
  lessonPath,
}: TrustLinksInput): LessonTrustLink[] {
  const links: LessonTrustLink[] = [
    { label: READING_LIST_LINK_LABEL, href: readingListHref(courseId, eraId) },
  ];
  const email = reportErrorEmail();
  if (email !== null) {
    links.push({
      label: REPORT_ERROR_LINK_LABEL,
      href: reportErrorHref({ email, dayNumber, lessonUrl: `${SITE_URL}${lessonPath}` }),
    });
  }
  return links;
}
