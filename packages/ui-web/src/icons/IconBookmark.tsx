import type { SVGProps } from 'react';

interface IconBookmarkProps extends SVGProps<SVGSVGElement> {
  /** When true, paints the ribbon solid — used to reflect the saved state. */
  filled?: boolean;
}

/**
 * Editorial-register bookmark ribbon. Outline by default, filled when the
 * lesson is saved. Stroke vocabulary matches `IconCheck` (16×16, 1.6
 * stroke, currentColor, round joins) so the toggle reads as part of the
 * same icon family.
 */
export function IconBookmark({ filled = false, ...props }: IconBookmarkProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 2.75h8v11l-4-2.75-4 2.75v-11z" />
    </svg>
  );
}
