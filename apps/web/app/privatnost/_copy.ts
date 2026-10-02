/**
 * Privacy page copy. Plain Serbian, no legal register: what is kept, why,
 * on what legal basis, where, for how long, and how to delete it. Linked
 * from the footer, the sign-in page and the Google consent screen. Keep it
 * true — every claim here matches:
 *
 * - the schema in `lib/server/db/schema.ts` (users: Google `sub`, email,
 *   name, picture URL, `created_at`, `last_seen_at`; sessions: token hash,
 *   created / expires; progress with `completed_at` per lesson and the last
 *   opened lesson; bookmarks with `created_at`),
 * - the scopes in `lib/server/auth/google.ts` (`openid email profile`),
 * - the cookies set by `lib/server/auth/*`,
 * - the one foreign script the CSP in `next.config.mjs` allows (Cloudflare
 *   Web Analytics),
 * - the backup retention in `deploy/backup.sh` (at most 14 days).
 *
 * The voice is impersonal on purpose: one person runs the site (see
 * /o-aplikaciji), so there is no "we".
 */
export const PRIVACY_EYEBROW = 'Privatnost';
export const PRIVACY_TITLE = 'Šta se čuva, i zašto';
export const PRIVACY_LEDE =
  'Istorija 365 radi i bez naloga. Nalog postoji samo da bi se napredak preneo na druge uređaje. Ovde je, bez sitnih slova, sve što se tada čuva.';
export const PRIVACY_UPDATED = 'Poslednja izmena: 30. septembar 2026.';

export interface PrivacySection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const PRIVACY_SECTIONS: readonly PrivacySection[] = [
  {
    id: 'ko-vodi',
    heading: 'Ko vodi sajt',
    paragraphs: [
      'Sajt Istorija 365 vodi privatno lice, ne firma. To lice je rukovalac podataka opisanih na ovoj strani i odgovara na svako pitanje o njima preko adrese na dnu strane.',
    ],
  },
  {
    id: 'bez-naloga',
    heading: 'Bez naloga',
    paragraphs: [
      'Dok čitaš bez prijave, pročitane i sačuvane lekcije pamte se samo u lokalnoj memoriji tvog pregledača i nestaju kad obrišeš podatke sajta. Nema reklama ni kolačića za praćenje.',
    ],
  },
  {
    id: 'statistika',
    heading: 'Statistika poseta',
    paragraphs: [
      'Posete se broje da bi se znalo koliko se sajt čita i koliko se brzo učitava. Za to služi Cloudflare Web Analytics, koji radi bez kolačića i ne prati te po drugim sajtovima.',
      'Beleži se koja je strana otvorena i sa koje se došlo, vrsta pregledača i sistema, država i vreme učitavanja. Ti podaci se ne povezuju sa tvojim nalogom ni sa napretkom i ne koriste se za reklame.',
    ],
  },
  {
    id: 'sa-nalogom',
    heading: 'Sa Google nalogom',
    paragraphs: [
      'Pri prijavi se od Google-a traže samo osnovni podaci profila, a čuvaju se ovi: stalni identifikator tvog Google naloga, e-adresa, ime i adresa slike profila. Ništa više: pošta, kontakti i kalendar ostaju nedostupni, a pristupni ključevi ka Google-u se ne čuvaju.',
      'Uz nalog se beleže vreme kada je napravljen i vreme poslednje prijave. Za svaku prijavu čuva se i zapis o sesiji: otisak kolačića (ne sam kolačić), sa vremenom nastanka i isteka.',
      'Uz to se čuva napredak: koje su lekcije pročitane i kada je svaka označena, koja je lekcija poslednja otvorena i koje su lekcije sačuvane i kada.',
      'Spisak naloga vidi samo osoba koja vodi sajt.',
    ],
  },
  {
    id: 'pravni-osnov',
    heading: 'Na osnovu čega',
    paragraphs: [
      'Nalog je dobrovoljan. Podaci naloga i napretka obrađuju se na osnovu tvog pristanka, koji daješ prijavom i povlačiš brisanjem naloga.',
      'Statistika poseta i isporuka sajta oslanjaju se na legitimni interes: da se zna koliko se sajt čita i da radi pouzdano i bezbedno. Cloudflare, preko čije mreže ide sav saobraćaj, pri tome obrađuje i IP adresu, da bi isporučio stranu i zaštitio sajt od napada. U bazi sajta IP adrese se ne čuvaju.',
    ],
  },
  {
    id: 'kolacici',
    heading: 'Kolačići',
    paragraphs: [
      'Jedan kolačić, __Host-l365_session, čuva prijavu trideset dana i produžava se dok koristiš aplikaciju. Tokom same prijave postoji i privremeni kolačić od deset minuta koji štiti od lažiranja zahteva. Nema kolačića trećih strana.',
    ],
  },
  {
    id: 'gde',
    heading: 'Gde i koliko dugo',
    paragraphs: [
      'Podaci naloga su na serveru u Helsinkiju, u Evropskoj uniji (Hetzner), i čuvaju se dok postoji nalog. Saobraćaj do servera ide preko Cloudflare-a, a prijava preko Google-a. Statistiku poseta obrađuje i čuva Cloudflare.',
      'Google i Cloudflare su američke kompanije, pa se podaci koji prolaze kroz njihove sisteme mogu obrađivati i van Srbije i Evropske unije, uz standardne ugovorne klauzule kojima se te kompanije obavezuju na zaštitu podataka.',
      'Rezervne kopije baze prave se svake noći i čuvaju najviše 14 dana.',
    ],
  },
  {
    id: 'brisanje',
    heading: 'Brisanje',
    paragraphs: [
      'Na strani Nalog postoji dugme Obriši nalog. Briše nalog, napredak i sačuvane lekcije odmah i trajno; iz rezervnih kopija nestaju najkasnije za 14 dana. Odjava briše napredak samo iz tog pregledača; nalog ostaje. Isto se dešava kad prijava istekne: pročitane i sačuvane lekcije nestaju iz tog pregledača, a ostaju na nalogu i vraćaju se pri sledećoj prijavi. Samo izmene koje do tada nisu stigle do naloga (na primer, bez mreže) ostaju u pregledaču, vezane za taj nalog, i šalju mu se pri sledećoj prijavi; ako se u tom pregledaču prijavi neko drugi, brišu se.',
    ],
  },
  {
    id: 'prava',
    heading: 'Tvoja prava',
    paragraphs: [
      'Možeš da tražiš uvid u podatke koji se o tebi čuvaju, njihovu ispravku ili brisanje, i da pristanak povučeš u svakom trenutku — brisanjem naloga ili porukom na adresu ispod.',
      'Ako smatraš da se tvoji podaci ne obrađuju u skladu sa zakonom, možeš da podneseš pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti (poverenik.rs).',
    ],
  },
];

export const PRIVACY_CONTACT_HEADING = 'Kontakt';
export const PRIVACY_CONTACT_BODY =
  'Za pitanja o podacima, ili ako želiš da se nešto proveri ili obriše umesto tebe:';
