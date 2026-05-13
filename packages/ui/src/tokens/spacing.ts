/**
 * 8-px grid with 4-px refinements where the prototype demands them.
 * Plus semantic layout aliases (reading column, shell, sidebar, topbar).
 */

export interface SpaceScale {
  readonly s0: string;
  readonly s1: string;
  readonly s2: string;
  readonly s3: string;
  readonly s4: string;
  readonly s5: string;
  readonly s6: string;
  readonly s7: string;
  readonly s8: string;
  readonly s9: string;
  readonly s10: string;
  readonly s11: string;
  readonly s12: string;
  readonly s13: string;
  readonly s14: string;
  readonly s15: string;
}

export const space: SpaceScale = {
  s0: '0',
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '20px',
  s6: '24px',
  s7: '28px',
  s8: '32px',
  s9: '40px',
  s10: '48px',
  s11: '56px',
  s12: '64px',
  s13: '80px',
  s14: '96px',
  s15: '120px',
};

export interface LayoutTokens {
  readonly readingColMax: string;
  readonly shellMax: string;
  readonly sidebarWidth: string;
  readonly topbarHeight: string;
}

export const layout: LayoutTokens = {
  readingColMax: '660px',
  shellMax: '1440px',
  sidebarWidth: '320px',
  topbarHeight: '64px',
};

export const spaceVarName: Record<keyof SpaceScale, string> = {
  s0: '--space-0',
  s1: '--space-1',
  s2: '--space-2',
  s3: '--space-3',
  s4: '--space-4',
  s5: '--space-5',
  s6: '--space-6',
  s7: '--space-7',
  s8: '--space-8',
  s9: '--space-9',
  s10: '--space-10',
  s11: '--space-11',
  s12: '--space-12',
  s13: '--space-13',
  s14: '--space-14',
  s15: '--space-15',
};

export const layoutVarName: Record<keyof LayoutTokens, string> = {
  readingColMax: '--reading-col',
  shellMax: '--shell-max',
  sidebarWidth: '--sidebar-width',
  topbarHeight: '--topbar-height',
};
