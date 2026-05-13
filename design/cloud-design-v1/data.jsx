// data.jsx — course structure, sample lessons, sample reading content

const CHAPTERS = [
  {
    id: "rani-srednji-vek",
    num: "I",
    title: "Doseljavanje Slovena i rani srednji vek",
    yearsLabel: "do 1166.",
    yearStart: 600,
    yearEnd: 1166,
    eraShort: "Rani srednji vek",
    lessonCount: 30,
    description:
      "Doseljavanje Srba na Balkan, prve župe, kneževine i pokrštavanje uoči podizanja Nemanjićke države.",
  },
  {
    id: "nemanjici",
    num: "II",
    title: "Nemanjićka Srbija",
    yearsLabel: "1166 — 1371.",
    yearStart: 1166,
    yearEnd: 1371,
    eraShort: "Nemanjići",
    lessonCount: 75,
    description:
      "Od Stefana Nemanje i Svetog Save do carstva Dušana Silnog — vek najveće kulturne i političke moći srednjovekovne Srbije.",
  },
  {
    id: "despotovina",
    num: "III",
    title: "Knez Lazar, despotovina i pad pod Turke",
    yearsLabel: "1371 — 1459.",
    yearStart: 1371,
    yearEnd: 1459,
    eraShort: "Despotovina",
    lessonCount: 30,
    description:
      "Kosovska bitka, despoti Stefan Lazarević i Đurađ Branković, i konačan pad Smedereva pod Mehmedom II.",
  },
  {
    id: "pod-osmanlijama",
    num: "IV",
    title: "Pod osmanskom vlašću",
    yearsLabel: "1459 — 1804.",
    yearStart: 1459,
    yearEnd: 1804,
    eraShort: "Osmansko doba",
    lessonCount: 60,
    description:
      "Tri i po veka života pod sultanom — pećka patrijaršija, hajduci, velike seobe i početak buđenja.",
  },
  {
    id: "ustanci",
    num: "V",
    title: "Prvi i Drugi srpski ustanak",
    yearsLabel: "1804 — 1830.",
    yearStart: 1804,
    yearEnd: 1830,
    eraShort: "Ustanci",
    lessonCount: 30,
    description:
      "Karađorđe, Miloš Obrenović, Sretenjski ustav i hatišerifi koji su Srbiji dali autonomiju.",
  },
  {
    id: "knjazevina",
    num: "VI",
    title: "Knjaževina i Kraljevina Srbija",
    yearsLabel: "1830 — 1918.",
    yearStart: 1830,
    yearEnd: 1918,
    eraShort: "Kraljevina",
    lessonCount: 60,
    description:
      "Berlinski kongres, balkanski ratovi, Veliki rat i ujedinjenje sa Južnim Slovenima.",
  },
  {
    id: "jugoslavija",
    num: "VII",
    title: "Jugoslavija",
    yearsLabel: "1918 — 1991.",
    yearStart: 1918,
    yearEnd: 1991,
    eraShort: "Jugoslavija",
    lessonCount: 60,
    description:
      "Kraljevina SHS, okupacija i NOB, socijalistička Jugoslavija i postepeni raspad federacije.",
  },
  {
    id: "savremena",
    num: "VIII",
    title: "Savremena Srbija",
    yearsLabel: "1991 — danas",
    yearStart: 1991,
    yearEnd: 2026,
    eraShort: "Savremena",
    lessonCount: 20,
    description:
      "Ratovi devedesetih, demokratske promene, evropski put i pitanja koja Srbija još uvek otvara.",
  },
];

const TOTAL_LESSONS = CHAPTERS.reduce((s, c) => s + c.lessonCount, 0); // 365

// Realistic Serbian-history lesson titles, mostly for Chapters I-III which are visible
// when reading the active lesson. Other chapters get generated placeholders so the
// sidebar feels populated.
const LESSON_TITLES = {
  "rani-srednji-vek": [
    "Sloveni pre dolaska na Balkan",
    "Velike seobe i prvi tragovi Srba",
    "Vizantija u VI veku",
    "Heraklije i naseljavanje Srba",
    "Pokrštavanje i prvi episkopi",
    "Knez Višeslav i prve župe",
    "Časlav Klonimirović i Raška",
    "Duklja i kralj Mihailo",
    "Bodin i kratko ujedinjenje",
    "Stefan Vojislav protiv Vizantije",
    "Letopis popa Dukljanina",
    "Veliki župani Raške",
    "Zavidovići i raskol u zemlji",
    "Tihomir i mlađi brat Nemanja",
    "Bitka kod Pantina",
  ],
  nemanjici: [
    "Stefan Nemanja preuzima vlast",
    "Sabor u Rasu i jeretici",
    "Osnivanje Studenice",
    "Rastko odlazi na Svetu Goru",
    "Hilandar — kuća srpske duhovnosti",
    "Stefan Prvovenčani i kraljevska kruna",
    "Sveti Sava i autokefalnost",
    "Žička povelja",
    "Radoslav, Vladislav, Uroš I",
    "Mileševa i prenos moštiju",
    "Kralj Dragutin i ugarska kruna",
    "Milutin — graditelj i ratnik",
    "Banjska, Gračanica, Studenica Hvostanska",
    "Stefan Dečanski i Velbužd",
    "Visoki Dečani — manastir kralja",
    "Dušan postaje kralj",
    "Krunisanje za cara u Skoplju",
    "Dušanov zakonik",
    "Bitka kod Stefanijane",
    "Smrt cara Dušana",
    "Car Uroš Nejaki",
    "Vukašin Mrnjavčević i Marička bitka",
    "Raspad carstva",
  ],
  despotovina: [
    "Knez Lazar i Moravska Srbija",
    "Bitka na Kosovu — uoči",
    "15. jun 1389.",
    "Posle Kosova — vazalstvo",
    "Stefan Lazarević u Angorskoj bici",
    "Despot Stefan — vitez i pesnik",
    "„Slovo ljubve”",
    "Beograd kao prestonica",
    "Đurađ Branković preuzima despotovinu",
    "Smederevo — poslednja tvrđava",
    "Pad Smedereva 1459.",
  ],
  "pod-osmanlijama": [
    "Posle pada — život pod sultanom",
    "Devširma i janičari",
    "Obnova Pećke patrijaršije",
    "Mehmed-paša Sokolović",
    "Hajduci i uskoci",
    "Velika seoba pod Čarnojevićem",
    "Druga seoba 1737/39.",
    "Karlovačka mitropolija",
    "Dositej Obradović",
  ],
  ustanci: [
    "Seča knezova 1804.",
    "Karađorđe diže ustanak",
    "Bitka na Mišaru",
    "Ivankovac, Deligrad, Loznica",
    "Pad ustanka 1813.",
    "Takovski ustanak — Miloš",
    "Hatišerifi i autonomija",
    "Sretenjski ustav 1835.",
  ],
  knjazevina: [
    "Knjaz Miloš i Ustavobranitelji",
    "Aleksandar Karađorđević",
    "Mihailo Obrenović i predaja gradova",
    "Berlinski kongres 1878.",
    "Kralj Milan i nezavisnost",
    "Majski prevrat 1903.",
    "Carinski rat sa Austrijom",
    "Balkanski ratovi",
    "Sarajevski atentat",
    "Cerska i Kolubarska bitka",
    "Albanska golgota",
    "Solunski front",
    "Probij i oslobođenje",
    "Ujedinjenje 1. decembra 1918.",
  ],
  jugoslavija: [
    "Kraljevina SHS",
    "Vidovdanski ustav",
    "Šestojanuarska diktatura",
    "Kralj Aleksandar u Marseju",
    "27. mart 1941.",
    "Aprilski rat",
    "Ravna gora i Užička republika",
    "Sutjeska i Neretva",
    "AVNOJ i nova država",
    "Rezolucija Informbiroa",
    "Samoupravljanje",
    "Pokret nesvrstanih",
    "Ustav iz 1974.",
    "Tito — smrt i posle",
  ],
  savremena: [
    "Antibirokratska revolucija",
    "Raspad SFRJ",
    "Sankcije i hiperinflacija",
    "Dejtonski sporazum",
    "Kosovo i NATO bombardovanje",
    "5. oktobar 2000.",
    "Atentat na Đinđića",
    "Crna Gora se osamostaljuje",
    "Proglašenje nezavisnosti Kosova",
    "Briselski sporazum",
  ],
};

// Build full lesson list with day numbers + reading times.
function buildLessons() {
  let day = 1;
  const out = [];
  CHAPTERS.forEach((ch) => {
    const titles = LESSON_TITLES[ch.id] || [];
    for (let i = 0; i < ch.lessonCount; i += 1) {
      const title = titles[i] || `${ch.eraShort} — lekcija ${i + 1}`;
      const minutes = 6 + ((day * 7) % 5); // 6–10 min, pseudo-varied
      out.push({
        id: `${ch.id}-${i + 1}`,
        chapterId: ch.id,
        chapterIndex: i,
        day,
        title,
        minutes,
        year: Math.round(
          ch.yearStart + ((ch.yearEnd - ch.yearStart) * i) / Math.max(1, ch.lessonCount - 1),
        ),
      });
      day += 1;
    }
  });
  return out;
}

const ALL_LESSONS = buildLessons();

// Sample reading body — used for any opened lesson. Cleaner than per-lesson
// content for a prototype. Adapts the day/title at the top via React.
const SAMPLE_BODY = [
  "Poslednje godine dvanaestog veka zatekle su Rasku u trenutku kada je samo jasna ruka mogla da je ujedini. Velikaši su godinama vodili tihe ratove oko nasledstva, manastiri su živeli izolovano, a Vizantija je s druge obale Save pratila svaki pokret, znajući da svaki nemir u brdima može da preraste u nešto što više neće moći da kontroliše.",
  "Stefan Nemanja je u to vreme već bio iskusan vladar mlađe braće. Njegov uspon nije bio iznenadan — bio je rezultat strpljive politike, brakova, savezništava i tihog osvajanja manastirskih centara. Ali tek kada je 1166. godine na saboru pred velikašima preuzeo vlast nad celokupnom Raškom, postalo je jasno da Srbija ulazi u novu eru. Eru u kojoj će se država i crkva graditi zajedno, kao dva dela jednog tela.",
  "U narednim decenijama, Nemanja je radio na nečemu što njegovi prethodnici nisu pokušavali — na ideji da Srbija nije samo zbir župa, već trajna zajednica sa pisanom tradicijom, manastirima koji žive od ktitorske ruke i zakonom koji vlada i vladara. Studenica, koja će postati središte te ideje, biće tek prvi u nizu kamenih izraza ovog programa.",
  "U toj epohi rađa se i njegov najmlađi sin, Rastko. Dečak koji će u tišini napustiti dvor, kao monah Sava postati jedan od najuticajnijih ljudi srednjovekovne Evrope, i koji će — više od svakog vojskovođe — odrediti put kojim će srpska država ići narednih dvesta godina.",
  "Ako želimo da razumemo zašto se XIII vek u Srbiji često naziva „zlatnim”, moramo da krenemo upravo od ovog trenutka. Od jednog sabora, jednog vladara, i pretpostavke da država može biti više od saveza ratnika.",
];

window.CHAPTERS = CHAPTERS;
window.ALL_LESSONS = ALL_LESSONS;
window.TOTAL_LESSONS = TOTAL_LESSONS;
window.SAMPLE_BODY = SAMPLE_BODY;
