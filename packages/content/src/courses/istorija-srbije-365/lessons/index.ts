import type { Lesson } from '../../../types.js';

import { eras } from '../eras.js';
import { sections } from '../sections.js';
import { authoredLessons } from './authored/index.js';
import { buildAllLessons } from './_buildStubs.js';

/** All 365 lessons for `istorija-srbije-365`, with authored overlays applied. */
export const lessons: readonly Lesson[] = buildAllLessons({
  eras,
  sections,
  authored: authoredLessons,
});
