/**
 * „Literatura i provera" — how the lessons' facts were checked, and what that
 * checking leaned on, era by era (review 2026-10-03 P1 4, 2026-10-01 item 9).
 *
 * Every entry below is taken from the checking record in `docs/review/`: the
 * historian pass over all 365 lessons (`era-NN-*.md`, 2026-09-30) and the
 * second- and third-source passes (`druga-provera/`, 2026-10-01). Only works
 * those reports actually cite are listed, and a standard work the reports say
 * was *not* available (e.g. the SKZ „Istorija srpskog naroda") is named only
 * as a limit, never as a source. This is not the bibliography the lessons
 * were written from — the texts were prepared with an AI model — and the copy
 * says so. Change it only together with the record it summarises.
 *
 * Voice as on /o-aplikaciji: impersonal about the project, „ti" to the reader.
 */

export interface ReadingWork {
  /** Author(s) or issuing body, as the reports cite them; absent for reference works. */
  readonly author?: string;
  readonly title: string;
  /**
   * How the title is set: a book or a reference work in italics (default),
   * an article in quotes, or `plain` when it is a description, not a title.
   */
  readonly form?: 'book' | 'article' | 'plain';
  /** Edition, year or what it was used for — one short clause. */
  readonly detail?: string;
}

export interface EraReadingList {
  readonly eraId: string;
  /** Days covered, as printed: „Dani 1–45". */
  readonly days: string;
  readonly works: readonly ReadingWork[];
  /** An era-specific limit of the check, when the record names one. */
  readonly caveat?: string;
}

export interface CourseReadingList {
  readonly eras: readonly EraReadingList[];
}

export const READING_LIST_EYEBROW = 'Literatura i provera';
export const READING_LIST_TITLE = 'Kako su proverene činjenice';
export const READING_LIST_LEDE =
  'Svih 365 lekcija prošlo je proveru činjenica krajem septembra 2026, a sporna mesta početkom oktobra i drugu, u nezavisnim izvorima. Ovde piše kako je to urađeno, gde su granice te provere i na koja se dela i izvore oslanjala — po epohama.';

export const METHOD_HEADING = 'Kako je tekst proveren';
export const METHOD_PARAGRAPHS: readonly string[] = [
  'Tekstove lekcija pripremio je AI model na osnovu domaće i međunarodne istoriografije, a autor sajta ih uređuje. Krajem septembra 2026. svih 365 lekcija prošlo je istorijsku proveru: za svaku proverljivu tvrdnju — datum, ime, mesto, broj, citat — traženi su izvori; nađene greške su ispravljene, a nesigurna mesta uglavnom ograđena. Gde se istoričari ne slažu, lekcija to i kaže.',
  'Početkom oktobra 2026. usledila je druga provera: 154 mesta za koja je u prvom prolazu nađen samo enciklopedijski pregled (Wikipedia) ponovo su proverena u najmanje dva nezavisna izvora. Potvrđeno je 138, tri su ispravljena, a preostalih 13 dodatno je istraženo i rešeno — ispravkom, blažom formulacijom, brisanjem ili potvrdom. Lekcija je menjana samo kada se dva izvora slažu protiv teksta. U oktobru 2026. tekst je prošao i jezičku lekturu.',
];

export const LIMITS_HEADING = 'Šta „provereno” znači, a šta ne';
export const LIMITS_PARAGRAPHS: readonly string[] = [
  'Obe provere urađene su uz pomoć AI modela koji je tražio i čitao izvore. To nije recenzija istoričara: nijedna lekcija još nema imenovanog recenzenta. Provera hvata pogrešne datume, imena, brojeve i pripisane citate; ne jemči da je svaka rečenica tačna i ne ocenjuje izbor tema ni ton. Deo potvrda počiva na slabijim izvorima — novinskim i popularnim sajtovima koji se međusobno slažu — a neka osnovna dela, poput „Istorije srpskog naroda” Srpske književne zadruge i „Leksikona srpskog srednjeg veka”, nisu bila dostupna u obliku koji se može pretraživati.',
  'Spiskovi ispod nisu bibliografija po kojoj su lekcije pisane, već dela i izvori na koje se provera za svaku epohu najviše oslanjala. Ako primetiš grešku, javi — svaka prijava se proverava, a ispravka ulazi u lekciju čim se potvrdi.',
];

export const ERA_WORKS_LABEL = 'Na šta se provera oslanjala';

const COROVIC: ReadingWork = {
  author: 'Vladimir Ćorović',
  title: 'Istorija srpskog naroda',
  detail: '1941; ceo tekst, citiran po stranama',
};

const SRPSKA_ENCIKLOPEDIJA: ReadingWork = {
  title: 'Srpska enciklopedija',
  detail: 'Matica srpska i SANU',
};

const DAI: ReadingWork = {
  author: 'Konstantin Porfirogenit',
  title: 'De administrando imperio',
};

const READING_LISTS: Readonly<Record<string, CourseReadingList>> = {
  'istorija-srbije-365': {
    eras: [
      {
        eraId: 'praistorija-i-antika',
        days: 'Dani 1–45',
        works: [
          {
            title: 'Antički pisci u prevodu',
            form: 'plain',
            detail:
              'Polibije, Livije, Velej Paterkul, Svetonije, Dion Kasije, Prokopije (izdanja LacusCurtius i Perseus)',
          },
          DAI,
          {
            author: 'Dušan Borić i saradnici',
            title: 'radiokarbonsko (AMS) datovanje Lepenskog Vira',
            form: 'plain',
            detail: 'Scientific Reports, 2018',
          },
          {
            author: 'Arheološki institut, Beograd',
            title: 'prikazi lokaliteta',
            form: 'plain',
            detail: 'Singidunum, Felix Romuliana, Kale-Krševica',
          },
          { author: 'J. B. Bury', title: 'History of the Later Roman Empire' },
          { ...COROVIC, detail: '1941; za doseljavanje Slovena i prve srpske vladare' },
        ],
        caveat:
          'Srpski akademski izvori za praistoriju i antiku slabo su dostupni u pretrazi, pa je nekoliko mesta ostalo ograđeno umesto potvrđeno.',
      },
      {
        eraId: 'nemanjici',
        days: 'Dani 46–105',
        works: [
          COROVIC,
          SRPSKA_ENCIKLOPEDIJA,
          DAI,
          { title: 'Danilovi nastavljači', detail: 'prevod, Projekat Rastko' },
          { author: 'Jovan Deretić', title: 'Istorija srpske književnosti' },
          { author: 'S. Vujić', title: 'Istorija srpskog rudarstva' },
          {
            author: 'D. Lazarević',
            title: 'Teritorija kralja Dragutina',
            form: 'article',
            detail: 'Glasnik Istorijskog arhiva Valjevo 25',
          },
          {
            author: 'Desanka Kovačević-Kojić',
            title: 'rad u časopisu Balcanica',
            form: 'plain',
            detail: 'XLV, 2014',
          },
        ],
      },
      {
        eraId: 'knez-lazar-i-despotovina',
        days: 'Dani 106–150',
        works: [
          COROVIC,
          {
            ...SRPSKA_ENCIKLOPEDIJA,
            detail: 'Matica srpska i SANU; „Brankovići”, „Đurađ Branković”',
          },
          {
            title: 'Leksikon CANU',
            detail: 'Ž. Andrijašević, „Crna Gora u vrijeme Balšića”',
          },
        ],
        caveat:
          'Za Smederevsku tvrđavu i predanja o Milošu Obiliću i Marku Kraljeviću dostupni izvori bili su turistički, novinski i školski — slabiji, ali međusobno nezavisni i saglasni.',
      },
      {
        eraId: 'osmansko-i-habzbursko-doba',
        days: 'Dani 151–195',
        works: [
          COROVIC,
          SRPSKA_ENCIKLOPEDIJA,
          { title: 'TDV İslâm Ansiklopedisi', detail: 'Türkiye Diyanet Vakfı' },
          { title: 'Pravoslavnaja enciklopedija' },
          { author: 'Predrag Puzović', title: 'Karlovačka mitropolija', form: 'article' },
          { author: 'Dositej Obradović', title: 'Život i priključenija' },
        ],
      },
      {
        eraId: 'srpska-revolucija',
        days: 'Dani 196–230',
        works: [
          COROVIC,
          {
            author: 'Vladimir Ćorović',
            title: 'Istorija Jugoslavije',
            detail: 'Vikizvornik',
          },
          SRPSKA_ENCIKLOPEDIJA,
          {
            author: 'Radomir J. Popović',
            title: 'Bukureški mir, knez Miloš i autonomija Srbije',
            form: 'article',
            detail: 'Istorijski institut, 2016',
          },
          {
            author: 'Danko Leovac',
            title: 'Empire in the Turmoil — The Ottoman Empire and the Balkans (1828–1833)',
            form: 'article',
            detail: 'Türk Tarih Kurumu',
          },
          {
            title: 'Ministarstvo odbrane Republike Srbije',
            form: 'plain',
            detail: 'prikazi bitaka',
          },
        ],
      },
      {
        eraId: 'knezevina-i-kraljevina',
        days: 'Dani 231–280',
        works: [
          COROVIC,
          SRPSKA_ENCIKLOPEDIJA,
          {
            author: 'S. G. Marković',
            title: 'rad u časopisu Balcanica',
            form: 'plain',
            detail: 'LI',
          },
          {
            author: 'Andrija Radenić',
            title: 'Spoljna politika Srbije u kontroverznoj istoriografiji',
          },
          { title: 'Ustav Kraljevine Srbije iz 1888.', form: 'plain', detail: 'izvorni tekst' },
          { title: 'Politika', detail: 'novinski članci o istoriji' },
        ],
        caveat:
          'Delo Slobodana Jovanovića i „Istorija srpskog naroda” (SKZ) za ovaj period nisu bili dostupni u obliku koji se može pretraživati.',
      },
      {
        eraId: 'jugoslavija-i-20-vek',
        days: 'Dani 281–340',
        works: [
          { author: 'Andrej Mitrović', title: 'Srbija u Prvom svetskom ratu' },
          { author: 'Branko Petranović', title: 'Istorija Jugoslavije 1918–1988' },
          {
            author: 'Jozo Tomasevich',
            title: 'The Chetniks; War and Revolution in Yugoslavia: Occupation and Collaboration',
          },
          {
            author: 'Bogoljub Kočović i Vladimir Žerjavić',
            title: 'proračuni ljudskih gubitaka u Drugom svetskom ratu',
            form: 'plain',
          },
          {
            title: 'Memorijalni muzej holokausta SAD (USHMM) i JUSP Jasenovac',
            form: 'plain',
            detail: 'za žrtve logora',
          },
          {
            author: 'Miroslav Svirčević',
            title: 'The New Territories of Serbia after the Balkan Wars of 1912–1913',
            form: 'article',
            detail: 'Balcanica XLIV, 2013',
          },
          {
            title: 'Ministarstvo odbrane Republike Srbije',
            form: 'plain',
            detail: 'prikazi bitaka 1914.',
          },
        ],
        caveat:
          'Brojevi žrtava nigde nisu svedeni na jedan broj bez institucionalnog izvora; gde se procene razilaze, lekcija daje raspon i kaže čiji je.',
      },
      {
        eraId: 'savremena-srbija',
        days: 'Dani 341–365',
        works: [
          {
            title: 'Međunarodni krivični sud za bivšu Jugoslaviju (MKSJ)',
            form: 'plain',
            detail: 'presude i optužnice',
          },
          { title: 'Human Rights Watch', form: 'plain', detail: 'izveštaji' },
          {
            title: 'Fond za humanitarno pravo',
            form: 'plain',
            detail: 'evidencije ljudskih gubitaka',
          },
          {
            title: 'UNHCR i Komesarijat za izbeglice',
            form: 'plain',
            detail: 'popis izbeglica 1996.',
          },
          { title: 'Komisija eksperata UN', form: 'plain', detail: 'izveštaj S/1994/674' },
          { title: 'Republički zavod za statistiku', form: 'plain', detail: 'popis 1991.' },
        ],
        caveat:
          'Brojevi žrtava menjani su samo na osnovu institucionalnog izvora — presuda MKSJ, izveštaja HRW, FHP i UNHCR.',
      },
    ],
  },
};

/** The course's reading list, or `null` for a course that has none yet. */
export function getReadingList(courseId: string): CourseReadingList | null {
  return READING_LISTS[courseId] ?? null;
}

/** Course ids that have a reading list — the static params of the page. */
export function readingListCourseIds(): readonly string[] {
  return Object.keys(READING_LISTS);
}
