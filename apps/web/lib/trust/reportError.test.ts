import { describe, expect, it } from 'vitest';

import { reportErrorEmail, reportErrorHref } from './reportError';

describe('reportErrorEmail', () => {
  it('is null when the setting is missing, empty or not an address', () => {
    expect(reportErrorEmail(undefined)).toBeNull();
    expect(reportErrorEmail('')).toBeNull();
    expect(reportErrorEmail('   ')).toBeNull();
    expect(reportErrorEmail('greske')).toBeNull();
    expect(reportErrorEmail('a@b?subject=x')).toBeNull();
  });

  it('returns a trimmed address', () => {
    expect(reportErrorEmail(' greske@istorija365.com ')).toBe('greske@istorija365.com');
  });
});

describe('reportErrorHref', () => {
  const href = reportErrorHref({
    email: 'greske@istorija365.com',
    dayNumber: 7,
    lessonUrl: 'https://istorija365.com/course/istorija-srbije-365/lesson/day-007',
  });

  it('addresses the configured inbox', () => {
    expect(href.startsWith('mailto:greske@istorija365.com?')).toBe(true);
  });

  it('names the day, zero-padded, in the subject', () => {
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('subject')).toBe('Greška u lekciji — Dan 007');
  });

  it('carries the lesson URL in the body', () => {
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
    expect(params.get('body')).toContain(
      'https://istorija365.com/course/istorija-srbije-365/lesson/day-007',
    );
  });

  it('encodes spaces as %20, never +', () => {
    expect(href).not.toContain('+');
    expect(href).toContain('Gre%C5%A1ka%20u%20lekciji');
  });
});
