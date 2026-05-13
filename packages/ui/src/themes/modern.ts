import type { Tokens } from '../tokens/index.js';
import { modernColorOverrides } from '../tokens/index.js';
import { editorial } from './editorial.js';

/**
 * Modern direction — dev-only reference, applied to `[data-direction="B"]`.
 * No v1 UI surface toggles this.
 */
export const modern: Tokens = {
  ...editorial,
  color: { ...editorial.color, ...modernColorOverrides },
};
