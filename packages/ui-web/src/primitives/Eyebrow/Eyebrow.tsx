import type { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
  return <p className="eyebrow">{children}</p>;
}
