import type { SVGProps } from 'react';

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M3 5h10M3 8h10M3 11h10" />
    </svg>
  );
}
