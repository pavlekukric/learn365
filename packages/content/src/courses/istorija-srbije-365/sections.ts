import type { Section } from '../../types.js';

const COURSE_ID = 'istorija-srbije-365';

/**
 * 28 sections covering all 365 lessons. Section ranges are contiguous
 * and non-overlapping; the validator (`validate.ts`) enforces this.
 *
 * Editorial breakpoints chosen so each section is ~10–20 lessons and
 * tells a single coherent sub-arc. The sidebar (`CourseSidebar`)
 * renders sections as the accordion unit.
 *
 * Era → number of sections:
 *   I.   Rani srednji vek      → 3 sections  (30 lessons)
 *   II.  Nemanjići              → 5 sections  (75 lessons)
 *   III. Despotovina            → 3 sections  (30 lessons)
 *   IV.  Pod osmanlijama        → 5 sections  (60 lessons)
 *   V.   Ustanci                → 2 sections  (30 lessons)
 *   VI.  Knjaževina/Kraljevina  → 4 sections  (60 lessons)
 *   VII. Jugoslavija            → 4 sections  (60 lessons)
 *   VIII. Savremena Srbija       → 2 sections  (20 lessons)
 */
export const sections: readonly Section[] = [
  // ───────────────── Era I — Rani srednji vek (days 1–30) ─────────────────
  {
    id: 'praistorija-i-antika',
    courseId: COURSE_ID,
    eraId: 'rani-srednji-vek',
    title: 'Praistorija i antika',
    subtitle: 'Od najstarijih kultura na Balkanu do rimskog nasleđa',
    order: 1,
    startDay: 1,
    endDay: 10,
  },
  {
    id: 'doseljavanje-slovena',
    courseId: COURSE_ID,
    eraId: 'rani-srednji-vek',
    title: 'Doseljavanje Slovena i pokrštavanje',
    subtitle: 'Seobe, naseljavanje Balkana i prvi episkopi',
    order: 2,
    startDay: 11,
    endDay: 20,
  },
  {
    id: 'prve-knezevine',
    courseId: COURSE_ID,
    eraId: 'rani-srednji-vek',
    title: 'Prve srpske kneževine',
    subtitle: 'Duklja, Raška i veliki župani pred Nemanjom',
    order: 3,
    startDay: 21,
    endDay: 30,
  },

  // ───────────────── Era II — Nemanjići (days 31–105) ─────────────────
  {
    id: 'rani-nemanjici',
    courseId: COURSE_ID,
    eraId: 'nemanjici',
    title: 'Rani Nemanjići',
    subtitle: 'Od Stefana Nemanje i Svetog Save do Stefana Prvovenčanog',
    order: 4,
    startDay: 31,
    endDay: 45,
  },
  {
    id: 'sredina-xiii-veka',
    courseId: COURSE_ID,
    eraId: 'nemanjici',
    title: 'Sredina XIII veka',
    subtitle: 'Radoslav, Vladislav, Uroš I i Mileševa',
    order: 5,
    startDay: 46,
    endDay: 55,
  },
  {
    id: 'milutin-i-decanski',
    courseId: COURSE_ID,
    eraId: 'nemanjici',
    title: 'Milutin i Stefan Dečanski',
    subtitle: 'Dragutin, Milutin, Velbužd i veliki ktitori',
    order: 6,
    startDay: 56,
    endDay: 70,
  },
  {
    id: 'dusanovo-carstvo',
    courseId: COURSE_ID,
    eraId: 'nemanjici',
    title: 'Dušanovo carstvo',
    subtitle: 'Krunisanje u Skoplju, Dušanov zakonik, kratki zenit',
    order: 7,
    startDay: 71,
    endDay: 90,
  },
  {
    id: 'pad-carstva',
    courseId: COURSE_ID,
    eraId: 'nemanjici',
    title: 'Pad carstva',
    subtitle: 'Uroš Nejaki, Mrnjavčevići i Marička bitka',
    order: 8,
    startDay: 91,
    endDay: 105,
  },

  // ───────────────── Era III — Despotovina (days 106–135) ─────────────────
  {
    id: 'moravska-srbija-i-kosovo',
    courseId: COURSE_ID,
    eraId: 'despotovina',
    title: 'Moravska Srbija i Kosovska bitka',
    subtitle: 'Knez Lazar, savezništva i 15. jun 1389.',
    order: 9,
    startDay: 106,
    endDay: 115,
  },
  {
    id: 'despot-stefan',
    courseId: COURSE_ID,
    eraId: 'despotovina',
    title: 'Despot Stefan Lazarević',
    subtitle: 'Angorska bitka, „Slovo ljubve”, Beograd kao prestonica',
    order: 10,
    startDay: 116,
    endDay: 125,
  },
  {
    id: 'djuradj-brankovic',
    courseId: COURSE_ID,
    eraId: 'despotovina',
    title: 'Đurađ Branković i pad Smedereva',
    subtitle: 'Poslednje tvrđave i 1459. godina',
    order: 11,
    startDay: 126,
    endDay: 135,
  },

  // ───────────────── Era IV — Pod osmanlijama (days 136–195) ─────────────────
  {
    id: 'zivot-pod-sultanom',
    courseId: COURSE_ID,
    eraId: 'pod-osmanlijama',
    title: 'Život pod sultanom',
    subtitle: 'Sandžaci, devširma i nova svakodnevica',
    order: 12,
    startDay: 136,
    endDay: 147,
  },
  {
    id: 'pecka-patrijarsija',
    courseId: COURSE_ID,
    eraId: 'pod-osmanlijama',
    title: 'Pećka patrijaršija',
    subtitle: 'Obnova 1557. i Mehmed-paša Sokolović',
    order: 13,
    startDay: 148,
    endDay: 159,
  },
  {
    id: 'hajduci-i-uskoci',
    courseId: COURSE_ID,
    eraId: 'pod-osmanlijama',
    title: 'Hajduci i uskoci',
    subtitle: 'Granični životi između tri carstva',
    order: 14,
    startDay: 160,
    endDay: 171,
  },
  {
    id: 'velike-seobe',
    courseId: COURSE_ID,
    eraId: 'pod-osmanlijama',
    title: 'Velike seobe Srba',
    subtitle: 'Arsenije III Čarnojević i seoba 1737/39.',
    order: 15,
    startDay: 172,
    endDay: 183,
  },
  {
    id: 'budenje-pred-ustanak',
    courseId: COURSE_ID,
    eraId: 'pod-osmanlijama',
    title: 'Buđenje pred ustanak',
    subtitle: 'Karlovačka mitropolija, Dositej, Vuk Karadžić',
    order: 16,
    startDay: 184,
    endDay: 195,
  },

  // ───────────────── Era V — Ustanci (days 196–225) ─────────────────
  {
    id: 'prvi-ustanak',
    courseId: COURSE_ID,
    eraId: 'ustanci',
    title: 'Prvi srpski ustanak',
    subtitle: 'Seča knezova, Karađorđe, Mišar i pad 1813.',
    order: 17,
    startDay: 196,
    endDay: 210,
  },
  {
    id: 'drugi-ustanak-i-autonomija',
    courseId: COURSE_ID,
    eraId: 'ustanci',
    title: 'Drugi ustanak i autonomija',
    subtitle: 'Takovo, hatišerifi i Sretenjski ustav',
    order: 18,
    startDay: 211,
    endDay: 225,
  },

  // ───────────────── Era VI — Knjaževina i Kraljevina Srbija (days 226–285) ─────────────────
  {
    id: 'knjazevina',
    courseId: COURSE_ID,
    eraId: 'kraljevina-srbija',
    title: 'Knjaževina pod Milošem i Ustavobraniteljima',
    subtitle: 'Dve dinastije i potraga za modernom državom',
    order: 19,
    startDay: 226,
    endDay: 240,
  },
  {
    id: 'mihailo-i-nezavisnost',
    courseId: COURSE_ID,
    eraId: 'kraljevina-srbija',
    title: 'Mihailo i nezavisnost',
    subtitle: 'Predaja gradova, Berlinski kongres, kralj Milan',
    order: 20,
    startDay: 241,
    endDay: 255,
  },
  {
    id: 'moderna-srbija',
    courseId: COURSE_ID,
    eraId: 'kraljevina-srbija',
    title: 'Moderna Srbija',
    subtitle: 'Majski prevrat, Carinski rat, aneksiona kriza',
    order: 21,
    startDay: 256,
    endDay: 270,
  },
  {
    id: 'balkanski-i-veliki-rat',
    courseId: COURSE_ID,
    eraId: 'kraljevina-srbija',
    title: 'Balkanski i Veliki rat',
    subtitle: 'Od Kumanova do Albanske golgote i Ujedinjenja',
    order: 22,
    startDay: 271,
    endDay: 285,
  },

  // ───────────────── Era VII — Jugoslavija (days 286–345) ─────────────────
  {
    id: 'kraljevina-shs',
    courseId: COURSE_ID,
    eraId: 'jugoslavija',
    title: 'Kraljevina SHS i Jugoslavija',
    subtitle: 'Vidovdanski ustav, Šestojanuarska diktatura, Marselj',
    order: 23,
    startDay: 286,
    endDay: 300,
  },
  {
    id: 'drugi-svetski-rat',
    courseId: COURSE_ID,
    eraId: 'jugoslavija',
    title: 'Drugi svetski rat',
    subtitle: '27. mart, Aprilski rat, Ravna gora, partizani, AVNOJ',
    order: 24,
    startDay: 301,
    endDay: 315,
  },
  {
    id: 'socijalisticka-jugoslavija',
    courseId: COURSE_ID,
    eraId: 'jugoslavija',
    title: 'Socijalistička Jugoslavija',
    subtitle: 'Informbiro, samoupravljanje, nesvrstani, Ustav 1974.',
    order: 25,
    startDay: 316,
    endDay: 330,
  },
  {
    id: 'kraj-jugoslavije',
    courseId: COURSE_ID,
    eraId: 'jugoslavija',
    title: 'Kraj Jugoslavije',
    subtitle: 'Smrt Tita, Memorandum, antibirokratska revolucija',
    order: 26,
    startDay: 331,
    endDay: 345,
  },

  // ───────────────── Era VIII — Savremena Srbija (days 346–365) ─────────────────
  {
    id: 'ratovi-devedesetih',
    courseId: COURSE_ID,
    eraId: 'savremena-srbija',
    title: 'Ratovi devedesetih',
    subtitle: 'Raspad SFRJ, sankcije, Dejton, NATO bombardovanje',
    order: 27,
    startDay: 346,
    endDay: 355,
  },
  {
    id: 'posle-2000',
    courseId: COURSE_ID,
    eraId: 'savremena-srbija',
    title: 'Srbija posle 2000.',
    subtitle: '5. oktobar, Đinđić, Kosovo, evropski put',
    order: 28,
    startDay: 356,
    endDay: 365,
  },
];
