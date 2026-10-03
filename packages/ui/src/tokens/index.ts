import type { ColorTokens } from './color.js';
import type { FontStacks, TypeScale } from './typography.js';
import type { LayoutTokens, SpaceScale } from './spacing.js';
import type { RadiiTokens } from './radii.js';
import type { MotionTokens } from './motion.js';
import type { ElevationTokens } from './elevation.js';

export type {
  ColorTokens,
  ElevationTokens,
  FontStacks,
  LayoutTokens,
  MotionTokens,
  RadiiTokens,
  SpaceScale,
  TypeScale,
};
export type { ColorRole, FontFamily, TypeStyle } from './typography.js';

export { colorVarName, editorialColors, modernColorOverrides, srgbFallback } from './color.js';
export { fontStacks, typeScale } from './typography.js';
export { layout, layoutVarName, space, spaceVarName } from './spacing.js';
export { radii, radiiVarName } from './radii.js';
export { motion, motionVarName } from './motion.js';
export { elevation, elevationVarName } from './elevation.js';

export interface Tokens {
  readonly color: ColorTokens;
  readonly fonts: FontStacks;
  readonly typeScale: TypeScale;
  readonly space: SpaceScale;
  readonly layout: LayoutTokens;
  readonly radii: RadiiTokens;
  readonly motion: MotionTokens;
  readonly elevation: ElevationTokens;
}
