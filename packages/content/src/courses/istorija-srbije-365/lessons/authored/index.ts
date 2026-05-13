import type { Lesson, LessonId } from '../../../../types.js';

import praistorijaIAntika001 from './praistorija-i-antika-001.js';
import praistorijaIAntika007 from './praistorija-i-antika-007.js';
import raniNemanjici001 from './rani-nemanjici-001.js';
import moravskaSrbijaIKosovo001 from './moravska-srbija-i-kosovo-001.js';
import prviUstanak005 from './prvi-ustanak-005.js';
import drugiSvetskiRat005 from './drugi-svetski-rat-005.js';

/**
 * Hand-authored lessons that override the corresponding stub at module
 * load time. Each new lesson is added here as it's written.
 *
 * Phase 1 substep 6 seeds 6 lessons spread across 5 eras so every
 * era shape gets exercised by the reader before the rest are authored.
 */
export const authoredLessons: Readonly<Record<LessonId, Lesson>> = {
  [praistorijaIAntika001.id]: praistorijaIAntika001,
  [praistorijaIAntika007.id]: praistorijaIAntika007,
  [raniNemanjici001.id]: raniNemanjici001,
  [moravskaSrbijaIKosovo001.id]: moravskaSrbijaIKosovo001,
  [prviUstanak005.id]: prviUstanak005,
  [drugiSvetskiRat005.id]: drugiSvetskiRat005,
};
