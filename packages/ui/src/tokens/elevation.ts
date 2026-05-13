/**
 * Elevation tokens. Shadows use warm rgba (not neutral black) to match
 * the parchment background tone.
 */

export interface ElevationTokens {
  readonly none: string;
  readonly card: string;
  readonly floating: string;
  readonly drawer: string;
}

export const elevation: ElevationTokens = {
  none: 'none',
  card: '0 1px 0 0 var(--rule)',
  floating: '0 16px 40px -20px rgba(40, 30, 10, 0.25)',
  drawer: '12px 0 40px -10px rgba(0, 0, 0, 0.2)',
};

export const elevationVarName: Record<keyof ElevationTokens, string> = {
  none: '--elev-none',
  card: '--elev-card',
  floating: '--elev-floating',
  drawer: '--elev-drawer',
};
