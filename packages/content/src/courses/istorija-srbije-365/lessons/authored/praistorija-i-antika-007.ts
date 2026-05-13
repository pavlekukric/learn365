import type { Lesson } from '../../../../types.js';

const lesson: Lesson = {
  id: 'praistorija-i-antika-007',
  courseId: 'istorija-srbije-365',
  sectionId: 'praistorija-i-antika',
  eraId: 'rani-srednji-vek',
  dayNumber: 7,
  order: 7,
  title: 'Provincije Moesia i Dalmacija',
  subtitle: 'Rimsko nasleđe na tlu Balkana',
  readingTimeMinutes: 9,
  year: 100,
  dateLabel: '1. vek pre — 6. vek posle Hr.',
  timelinePosition: '100 CE',
  summary:
    'Rimske provincije Dalmacija i Moesija oblikovale su mrežu puteva, gradova i kulturnih slojeva koje će kasnije slovenske generacije naslediti — od Sirmijuma i Singidunuma do Naissusa kao mesta rođenja Konstantina.',
  keyPeople: ['Trajan', 'Konstantin Veliki', 'Justinijan'],
  keyPlaces: ['Sirmijum', 'Singidunum', 'Naissus', 'Viminacijum'],
  content: [
    {
      type: 'paragraph',
      dropcap: true,
      text: 'Mreža puteva, zidina i logora koju je Rim ostavio na Balkanu ostala je vidljiva i nakon što je carstvo na zapadu davno nestalo. Dobar deo glavnih saobraćajnica savremene Srbije i danas prati liniju koju su pre dve hiljade godina označili rimski mernici, a velika gradska imena — Beograd, Niš, Sremska Mitrovica — počivaju na rimskim temeljima. Razumevanje rimske organizacije ovog prostora nije akademska zanimacija; ono daje rečnik kojim ćemo opisivati sve što dolazi posle.',
    },
    {
      type: 'paragraph',
      text: 'Rimska osvajanja Balkana tekla su u tri velika talasa. Prvi je obuhvatao primorje i unutrašnjost dalmatinskih plemena u trećem i drugom veku pre nove ere — sukobi sa Ilirima, dugogodišnja borba protiv Delmata i kraljice Teute, polagano podčinjavanje obale. Drugi talas, u prvom veku pre nove ere i prvim decenijama nove ere, organizovao je dunavski limes i počeo da romanizuje unutrašnjost. Treći je bila pacifikacija tračkog prostora na istoku.',
    },
    {
      type: 'paragraph',
      text: 'Iz tog procesa nastale su dve velike provincije koje pokrivaju veći deo onoga što danas zovemo Srbijom: Dalmacija na zapadu i Moesija — kasnije podeljena na Donju i Gornju — na istoku i severu. Granice među njima nisu bile zamišljene kao prepreke, već kao administrativni okviri. Vojnici, trgovci i imovinski upravnici prelazili su iz jedne u drugu rutinski, prateći rimske puteve i karavanske trase.',
    },
    { type: 'heading', level: 2, text: 'Sirmijum, Singidunum, Naissus' },
    {
      type: 'paragraph',
      text: 'Tri grada izdvajaju se u rimskoj mreži na ovom prostoru. Sirmijum, danas Sremska Mitrovica, postao je jedna od četiri carske rezidencije u kasnoj rimskoj epohi — u njemu su živeli i upravljali carevi, kuju se novci, donose carski reskripti. Singidunum, na ušću Save u Dunav, bio je granični logor IV Flavijeve legije i ključna tačka limesa; ispod modernog Beograda i danas leže zidovi koje su podigli njegovi vojnici. Naissus, današnji Niš, bio je važno raskršće balkanskih puteva — u njemu se 274. godine rodio Konstantin, prvi rimski car hrišćanin.',
    },
    {
      type: 'paragraph',
      text: 'Manje poznata, ali jednako značajna, bila su naselja poput Viminacijuma (kod Kostolca) i Diane (kod Kladova). Viminacijum je tokom drugog veka rastao do statusa glavnog grada Moesije Gornje, sa amfiteatrom, banjama i populacijom od više desetina hiljada stanovnika. Njegova istraživanja u poslednjim decenijama izmenila su razumevanje kako su rimska provincijska središta zaista izgledala — više nalik živim metropolama nego što su udžbenici dugo prikazivali.',
    },
    {
      type: 'quote',
      text: 'Ab Singiduno ad Viminacium milia passuum LXIIII.',
      attribution: 'natpis sa rimskog miljokaza',
    },
    {
      type: 'paragraph',
      text: 'Život u provincijama nije bio jednoobrazan. Latinski jezik dominirao je u administraciji i vojsci, ali se grčki govorio u višim slojevima i u istočnim delovima Moesije. Domaće stanovništvo — Iliri, Tračani, Kelti pomešani sa raznim doseljenim grupama — zadržalo je svoj jezik i običaje generacijama. Rimska politika nije insistirala na potpunoj kulturnoj asimilaciji; ona je nudila državljanstvo, vojnu karijeru i pravne mehanizme onima koji su je prihvatili, i toleranciju onima koji nisu.',
    },
    {
      type: 'paragraph',
      text: 'Krajem trećeg veka, kada se carstvo administrativno reorganizuje, Balkan dobija novu ulogu — postaje srce vojne snage carstva. Iliričke legije, regrutovane uglavnom na našem prostoru, čine kičmu rimske vojske u dobrom delu četvrtog veka. Iz redova tih legija dolaze i carevi — Aurelijan, Klaudije II, Galerije, Konstantin, Justinijan — od kojih su mnogi rođeni na teritoriji današnje Srbije ili Hrvatske.',
    },
    {
      type: 'paragraph',
      text: 'Kad u sedmom veku Sloveni budu naseljavali ovaj prostor, oni ne dolaze u prazno polje. Dolaze u predeo prošaran ruševinama, kamenim putevima i napuštenim gradovima — i u susret naselju koje je, već vekovima, hrišćansko. Tu sredinu, sa svim njenim slojevima, ne smemo previdjeti kad bilo koji kasniji vek pokušamo da razumemo.',
    },
  ],
};

export default lesson;
