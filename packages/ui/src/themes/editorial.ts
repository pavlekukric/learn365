import type { Tokens } from '../tokens/index.js';
import {
  editorialColors,
  elevation,
  fontStacks,
  layout,
  motion,
  radii,
  space,
  typeScale,
} from '../tokens/index.js';

/**
 * Editorial theme — the only direction exposed in v1.
 * Warm parchment, Spectral serif, evergreen accent.
 */
export const editorial: Tokens = {
  color: editorialColors,
  fonts: fontStacks,
  typeScale,
  space,
  layout,
  radii,
  motion,
  elevation,
};
