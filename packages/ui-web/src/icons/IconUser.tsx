import type { SVGProps } from 'react';

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="8" cy="5.25" r="2.75" />
      <path d="M2.75 13.75c.55-2.7 2.5-4.25 5.25-4.25s4.7 1.55 5.25 4.25" />
    </svg>
  );
}
