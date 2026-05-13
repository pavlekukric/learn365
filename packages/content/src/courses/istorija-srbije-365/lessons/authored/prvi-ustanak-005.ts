import type { Lesson } from '../../../../types.js';

const lesson: Lesson = {
  id: 'prvi-ustanak-005',
  courseId: 'istorija-srbije-365',
  sectionId: 'prvi-ustanak',
  eraId: 'ustanci',
  dayNumber: 200,
  order: 5,
  title: 'Prvi sukobi i pobune',
  subtitle: 'Ustanak kao niz paralelnih požara u proleće 1804.',
  readingTimeMinutes: 9,
  year: 1804,
  dateLabel: 'proleće — leto 1804.',
  timelinePosition: '1804',
  summary:
    'U proleće i leto 1804. godine Prvi srpski ustanak širi se kao niz paralelnih lokalnih pobuna koje, malo po malo, prelaze iz antijaničarskog otpora u organizovani rat za samoupravu Beogradskog pašaluka.',
  keyPeople: [
    'Karađorđe Petrović',
    'Stanoje Glavaš',
    'Hadži Ruvim',
    'Hadži Milentije Filipović',
  ],
  keyPlaces: ['Šumadija', 'Beogradski pašaluk', 'Kragujevac', 'Topola'],
  content: [
    {
      type: 'paragraph',
      dropcap: true,
      text: 'Slika ustanka kao jedne organizovane vojne kampanje koja kreće iz Orašca u februaru 1804. godine — slika koju nam udžbenici često nude — više je retroaktivna konstrukcija nego stvarnost prvih meseci pobune. Stvarna početna faza Prvog srpskog ustanka bila je niz paralelnih požara koji su, malo po malo, počeli da gore jedan ka drugom.',
    },
    {
      type: 'paragraph',
      text: 'Šumadija je u proleće 1804. godine bila zemlja u kojoj zvanične vlasti više nije bilo. Dahije — janičarski upravljači u Beogradskom pašaluku — pobili su, u takozvanoj seči knezova krajem januara, lokalne starešine koje su pokušavale da spreče sopstveno hapšenje. Lokalna kneževska mreža, koja je decenijama posredovala između naroda i osmanske vlasti, bila je preko noći obezglavljena. Ono što je usledilo nije bilo samo zaverenički plan grupe ustanika — bila je to spontana eksplozija u nizu sela istovremeno.',
    },
    {
      type: 'paragraph',
      text: 'Karađorđe Petrović, gazda iz Topole, izabran je u Orašcu početkom februara za vožda — ne kao kralj ili komandant nego kao prvi među odlukama lokalnih starešina. Ali Karađorđe nije bio jedini centar otpora. Stanoje Glavaš, hajdučki harambaša, već je vodio sukobe sa janičarima u istočnoj Šumadiji. Hadži Milentije Filipović, sveštenik iz Trnave, organizovao je pobunu u rudničkom kraju. Hadži Ruvim, prota iz Bogovađe, slao je pisma duž cele oblasti pozivajući na zajedničku akciju.',
    },
    { type: 'heading', level: 2, text: 'Mart, april, maj — talas se širi' },
    {
      type: 'paragraph',
      text: 'Prvi otvoreni sukobi izbili su sredinom februara, kada su ustanici opkolili janičarske posade u manjim gradovima poput Rudnika, Bajinog Sela i Kragujevca. Većina tih posada bila je malobrojna i nepripremljena za organizovanu opsadu — oslanjala se na pretpostavku da raja nema sredstava niti volje da se organizuje. Ta pretpostavka pokazala se pogrešnom.',
    },
    {
      type: 'paragraph',
      text: 'Do proleća, ustanak je obuhvatao gotovo celu Šumadiju. Veće gradove, poput Beograda, Smedereva i Užica, držale su jače janičarske posade — ali sela i manje varošice prelazile su pod ustaničku kontrolu jedna za drugom. Ustanici su organizovani po starinskom srpskom modelu četovanja: lokalne čete od desetina ili stotina ljudi, predvođene starešinama koje su znali ko su, sa improvizovanom organizacijom snabdevanja kroz sela.',
    },
    {
      type: 'paragraph',
      text: 'U toj fazi ustanak je još uvek mogao da se predstavi kao pobuna protiv janičara, a ne protiv sultana. Lokalne starešine slale su molbe i sultanu i ruskom dvoru u kojima su isticale lojalnost legitimnoj osmanskoj vlasti i tražile pomoć protiv „nepravednih dahija". To je bila politički pažljiva pozicija — i u prvim mesecima sultan Selim III ju je, gotovo nehotice, prihvatio, tolerišući antijaničarsku pobunu jer su mu sami dahije već dugo bili problem.',
    },
    {
      type: 'quote',
      text: 'Mi nismo dignuti protiv carskog dvora, već protiv onih koji su carsko ime potkopali.',
      attribution: 'iz pisma starešina sultanu, leto 1804.',
    },
    {
      type: 'paragraph',
      text: 'Ali kako su meseci prolazili, postajalo je jasno da povratak na pre-januarsko stanje više nije moguć. Ustanici su počeli da formiraju trajnije institucije: lokalne savete, sudove, ustaničku skupštinu. Karađorđev autoritet jačao je sa svakom novom pobedom. Do leta, ustanak je prerastao iz pobune u rat za samoupravu — proces u kojem je svaki naredni mesec teško izgladio prethodne kompromise.',
    },
  ],
};

export default lesson;
