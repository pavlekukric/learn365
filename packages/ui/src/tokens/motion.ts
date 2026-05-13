/**
 * Motion tokens. The single shared easing curve is the editorial timing
 * function used across the prototype; durations split by interaction class.
 */

export interface MotionTokens {
  readonly easingEditorial: string;
  readonly durationFast: string;
  readonly durationBase: string;
  readonly durationMedium: string;
  readonly durationSlow: string;
}

export const motion: MotionTokens = {
  easingEditorial: 'cubic-bezier(.2, .7, .2, 1)',
  durationFast: '120ms',
  durationBase: '150ms',
  durationMedium: '350ms',
  durationSlow: '400ms',
};

export const motionVarName: Record<keyof MotionTokens, string> = {
  easingEditorial: '--ease',
  durationFast: '--dur-fast',
  durationBase: '--dur-base',
  durationMedium: '--dur-medium',
  durationSlow: '--dur-slow',
};
