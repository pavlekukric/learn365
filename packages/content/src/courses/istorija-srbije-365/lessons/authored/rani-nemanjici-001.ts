import type { Lesson } from '../../../../types.js';

const lesson: Lesson = {
  id: 'rani-nemanjici-001',
  courseId: 'istorija-srbije-365',
  sectionId: 'rani-nemanjici',
  eraId: 'nemanjici',
  dayNumber: 31,
  order: 1,
  title: 'Stefan Nemanja preuzima vlast',
  subtitle: 'Sabor velikaša u Rasu i tihi početak nove ere',
  readingTimeMinutes: 9,
  year: 1166,
  dateLabel: 'oko 1166.',
  timelinePosition: '1166',
  summary:
    'Sabor u Rasu 1166. godine i Nemanjina pobeda nad bratom Tihomirom postavili su temelj nemanjićke dinastije i ideje države koja se gradi pisanim zakonom i manastirskom tradicijom.',
  keyPeople: ['Stefan Nemanja', 'Tihomir', 'Manuel I Komnen', 'Rastko Nemanjić'],
  keyPlaces: ['Ras', 'Pantino', 'Studenica'],
  content: [
    {
      type: 'paragraph',
      dropcap: true,
      text: 'Poslednje godine dvanaestog veka zatekle su Rasku u trenutku kada je samo jasna ruka mogla da je ujedini. Velikaši su godinama vodili tihe ratove oko nasledstva, manastiri su živeli izolovano, a Vizantija je s druge obale Save pratila svaki pokret, znajući da svaki nemir u brdima može da preraste u nešto što više neće moći da kontroliše.',
    },
    {
      type: 'paragraph',
      text: 'Stefan Nemanja je u to vreme već bio iskusan vladar mlađih braće. Njegov uspon nije bio iznenadan — bio je rezultat strpljive politike, brakova, savezništava i tihog osvajanja manastirskih centara. Njegov otac, veliki župan Zavida, podelio je domene među četiri sina; Nemanja, kao najmlađi, dobio je manju oblast — Toplicu, Ibar, Rasinu i deo Dubočice. Iz tog malog ugla pažljivo je gradio mrežu uticaja.',
    },
    {
      type: 'paragraph',
      text: 'Prelomna tačka došla je 1166. godine, na saboru velikaša pred manastirom Đurđevi stupovi. Tihomir, najstariji brat i zvaničan veliki župan, sukobio se sa Nemanjom oko Nemanjinog samostalnog gradjenja crkava i prijema vizantijskog priznanja od cara Manuela Komnena. Sabor — sastav nepoznatih nam u tačnom broju, ali okupljen iz vodećih raških porodica — odlučio je u korist mlađeg brata. Tihomir je bio uhapšen i poslan u tamnicu; Nemanja je postao veliki župan.',
    },
    { type: 'heading', level: 2, text: 'Bitka kod Pantina' },
    {
      type: 'paragraph',
      text: 'Tihomir, oslobođen uz pomoć vizantijskog odreda, pokušao je da povrati vlast. Sukob se završio na Pantinu, pored reke Sitnice, gde su Nemanjine snage potukle bratovljeve vizantijske najamnike. Tihomir je u toj bici pao, prema kasnijim hronikama, utopivši se u reci. Bila je to prva otvorena pobeda Nemanjine politike — i jasan signal Vizantiji da nova ravnoteža sila na ovom prostoru postoji bez obzira na carsko priznanje.',
    },
    {
      type: 'paragraph',
      text: 'U narednim decenijama, Nemanja je radio na nečemu što njegovi prethodnici nisu pokušavali — na ideji da Srbija nije samo zbir župa, već trajna zajednica sa pisanom tradicijom, manastirima koji žive od ktitorske ruke i zakonom koji vlada i vladara. Studenica, koja će postati središte te ideje, biće tek prvi u nizu kamenih izraza ovog programa.',
    },
    {
      type: 'quote',
      text: 'Zakonom valja vladati, a ne silom; jer sila je za jedan dan, a zakon za vek.',
      attribution: 'pripisano sv. Savi',
    },
    {
      type: 'paragraph',
      text: 'U toj epohi rađa se i njegov najmlađi sin, Rastko. Dečak koji će u tišini napustiti dvor, kao monah Sava postati jedan od najuticajnijih ljudi srednjovekovne Evrope, i koji će — više od svakog vojskovođe — odrediti put kojim će srpska država ići narednih dvesta godina.',
    },
    {
      type: 'paragraph',
      text: 'Ako želimo da razumemo zašto se XIII vek u Srbiji često naziva „zlatnim", moramo da krenemo upravo od ovog trenutka. Od jednog sabora, jednog vladara, i pretpostavke da država može biti više od saveza ratnika. Sabor iz 1166. godine nije bio simbolično krunisanje; bio je tihi početak nove ere, čiji puni obrisi neće biti vidljivi još decenijama.',
    },
  ],
};

export default lesson;
