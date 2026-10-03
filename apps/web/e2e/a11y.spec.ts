import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated accessibility pass (review 2026-09-30 item 19): axe-core over
 * the main routes, on desktop and on a phone (`a11y-desktop`,
 * `a11y-mobile`). WCAG 2.x A/AA rules; only `serious` and `critical`
 * findings fail — `minor` / `moderate` ones are attached as annotations,
 * not gated.
 *
 * KNOWN lists findings that exist today and belong to another change. An
 * entry is a rule *and* the elements it may hit, so the same rule anywhere
 * else still fails. Known hits are reported as annotations on every run;
 * delete the entry when its fix lands.
 */
const ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'Course overview', path: '/course/istorija-srbije-365' },
  { name: 'Lesson', path: '/course/istorija-srbije-365/lesson/day-001' },
  { name: 'About', path: '/o-aplikaciji' },
  { name: 'Reading list', path: '/course/istorija-srbije-365/literatura' },
  { name: 'Privacy', path: '/privatnost' },
  { name: '404', path: '/ova-strana-ne-postoji' },
] as const;

interface KnownIssue {
  readonly rule: string;
  /** Matched against the node's CSS target (CSS-module class names keep their readable prefix). */
  readonly target: RegExp;
  readonly why: string;
}

const KNOWN: readonly KnownIssue[] = [];

const GATED_IMPACTS = new Set(['serious', 'critical']);

function knownIssue(rule: string, target: string): KnownIssue | undefined {
  return KNOWN.find((issue) => issue.rule === rule && issue.target.test(target));
}

test.describe('History 365 — accessibility (axe)', () => {
  for (const route of ROUTES) {
    test(`${route.name} has no serious or critical axe violations`, async ({ page }, testInfo) => {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      // Let the client-side state (progress, account probe) settle before scanning.
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const failures: {
        rule: string;
        impact: string;
        help: string;
        target: string;
        summary: string;
      }[] = [];
      for (const violation of results.violations) {
        const impact = violation.impact ?? 'unknown';
        if (!GATED_IMPACTS.has(impact)) {
          testInfo.annotations.push({
            type: 'a11y (not gated)',
            description: `${violation.id} (${impact}, ${String(violation.nodes.length)} nodes)`,
          });
          continue;
        }
        for (const node of violation.nodes) {
          const target = node.target.join(' ');
          const summary = (node.failureSummary ?? '').split('\n').slice(0, 3).join(' ');
          const known = knownIssue(violation.id, target);
          if (known !== undefined) {
            testInfo.annotations.push({
              type: 'known a11y issue',
              description: `${violation.id} at ${target}: ${known.why} — ${summary}`,
            });
            continue;
          }
          failures.push({ rule: violation.id, impact, help: violation.help, target, summary });
        }
      }

      expect(failures, `${route.path}: serious/critical axe violations`).toEqual([]);
    });
  }
});
