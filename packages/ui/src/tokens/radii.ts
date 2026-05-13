export interface RadiiTokens {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly pill: string;
}

export const radii: RadiiTokens = {
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '16px',
  pill: '999px',
};

export const radiiVarName: Record<keyof RadiiTokens, string> = {
  sm: '--r-sm',
  md: '--r-md',
  lg: '--r-lg',
  xl: '--r-xl',
  pill: '--r-pill',
};
