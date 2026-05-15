import type { Era } from '../../types.js';

const COURSE_ID = 'istorija-srbije-365';

/**
 * The 8 historical eras of Istorija Srbije 365.
 *
 * Year ranges, lesson counts, and editorial copy are ported from the
 * approved Cloud Design V1 (`design/cloud-design-v1/data.jsx`). Eras
 * drive the historical timeline; Sections (see `sections.ts`) drive
 * the sidebar accordion.
 *
 * Lesson counts per era: 30 + 75 + 30 + 60 + 30 + 60 + 60 + 20 = 365.
 */
export const eras: readonly Era[] = [
  {
    // The `id` is retained ("rani-srednji-vek") because it is referenced by
    // every section + authored lesson in this era; renaming would cascade
    // through ProgressStore localStorage keys derived elsewhere. The title +
    // metadata are widened to honestly cover the era's actual chronological
    // span (Phase 6.8h) — the first section, "Praistorija i antika", reaches
    // back to Lepenski Vir at 9500 BCE, so the old `yearStart: 600` framed
    // those lessons under the wrong era.
    id: 'rani-srednji-vek',
    courseId: COURSE_ID,
    num: 'I',
    title: 'Od praistorije do ranog srednjeg veka',
    description:
      'Od Lepenskog Vira i Vinčanske kulture, preko ilirskih plemena i rimskog nasleđa, do dolaska Slovena, prvih župa i kneževina uoči podizanja Nemanjićke države.',
    yearStart: -9500,
    yearEnd: 1166,
    yearsLabel: 'praistorija – 1166',
    eraShort: 'Praistorija i rani srednji vek',
    order: 1,
  },
  {
    id: 'nemanjici',
    courseId: COURSE_ID,
    num: 'II',
    title: 'Nemanjićka Srbija',
    description:
      'Od Stefana Nemanje i Svetog Save do carstva Dušana Silnog — vek najveće kulturne i političke moći srednjovekovne Srbije.',
    yearStart: 1166,
    yearEnd: 1371,
    yearsLabel: '1166–1371',
    eraShort: 'Nemanjići',
    order: 2,
  },
  {
    id: 'despotovina',
    courseId: COURSE_ID,
    num: 'III',
    title: 'Knez Lazar, despotovina i pad pod Turke',
    description:
      'Kosovska bitka, despoti Stefan Lazarević i Đurađ Branković, i konačan pad Smedereva pod Mehmedom II.',
    yearStart: 1371,
    yearEnd: 1459,
    yearsLabel: '1371–1459',
    eraShort: 'Despotovina',
    order: 3,
  },
  {
    id: 'pod-osmanlijama',
    courseId: COURSE_ID,
    num: 'IV',
    title: 'Pod osmanskom vlašću',
    description:
      'Tri i po veka života pod sultanom — Pećka patrijaršija, hajduci, velike seobe i početak buđenja.',
    yearStart: 1459,
    yearEnd: 1804,
    yearsLabel: '1459–1804',
    eraShort: 'Osmansko doba',
    order: 4,
  },
  {
    id: 'ustanci',
    courseId: COURSE_ID,
    num: 'V',
    title: 'Prvi i Drugi srpski ustanak',
    description:
      'Karađorđe, Miloš Obrenović, Sretenjski ustav i hatišerifi koji su Srbiji dali autonomiju.',
    yearStart: 1804,
    yearEnd: 1830,
    yearsLabel: '1804–1830',
    eraShort: 'Ustanci',
    order: 5,
  },
  {
    id: 'kraljevina-srbija',
    courseId: COURSE_ID,
    num: 'VI',
    title: 'Knjaževina i Kraljevina Srbija',
    description:
      'Berlinski kongres, balkanski ratovi, Veliki rat i ujedinjenje sa Južnim Slovenima.',
    yearStart: 1830,
    yearEnd: 1918,
    yearsLabel: '1830–1918',
    eraShort: 'Kraljevina',
    order: 6,
  },
  {
    id: 'jugoslavija',
    courseId: COURSE_ID,
    num: 'VII',
    title: 'Jugoslavija',
    description:
      'Kraljevina SHS, okupacija i NOB, socijalistička Jugoslavija i postepeni raspad federacije.',
    yearStart: 1918,
    yearEnd: 1991,
    yearsLabel: '1918–1991',
    eraShort: 'Jugoslavija',
    order: 7,
  },
  {
    id: 'savremena-srbija',
    courseId: COURSE_ID,
    num: 'VIII',
    title: 'Savremena Srbija',
    description:
      'Ratovi devedesetih, demokratske promene, evropski put i pitanja koja Srbija još uvek otvara.',
    yearStart: 1991,
    yearEnd: 2026,
    yearsLabel: '1991–danas',
    eraShort: 'Savremena',
    order: 8,
  },
];
