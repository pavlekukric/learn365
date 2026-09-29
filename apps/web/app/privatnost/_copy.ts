/**
 * Privacy page copy. Plain Serbian, no legal register: what is kept, why,
 * where, for how long, and how to delete it. Linked from the footer, the
 * sign-in page and the Google consent screen. Keep it true — every claim
 * here matches the schema in `lib/server/db/schema.ts`, the cookies set
 * by `lib/server/auth/*` and the one foreign script the CSP in
 * `next.config.mjs` allows (Cloudflare Web Analytics).
 */
export const PRIVACY_EYEBROW = 'Privatnost';
export const PRIVACY_TITLE = 'Šta čuvamo, i zašto';
export const PRIVACY_LEDE =
  'History 365 radi i bez naloga. Nalog postoji samo da bi se napredak preneo na druge uređaje. Ovde je, bez sitnih slova, sve što se tada čuva.';
export const PRIVACY_UPDATED = 'Poslednja izmena: 29. septembar 2026.';

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
      'History 365 vodi privatno lice, ne firma. To lice je rukovalac podataka opisanih na ovoj strani i odgovara na svako pitanje o njima preko adrese na dnu strane.',
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
      'Brojimo posete da bismo znali koliko se sajt čita i koliko se brzo učitava. Za to koristimo Cloudflare Web Analytics, koji radi bez kolačića i ne prati te po drugim sajtovima.',
      'Beleži se koja je strana otvorena i sa koje se došlo, vrsta pregledača i sistema, država i vreme učitavanja. Ti podaci se ne povezuju sa tvojim nalogom ni sa napretkom, i ne koristimo ih za reklame.',
    ],
  },
  {
    id: 'sa-nalogom',
    heading: 'Sa Google nalogom',
    paragraphs: [
      'Kad se prijaviš, od Google-a dobijamo i čuvamo četiri stvari: stalni identifikator tvog naloga, e-adresu, ime i sliku profila. Ništa više: ne čitamo poštu, kontakte ni kalendar, i ne čuvamo pristupne ključeve ka Google-u.',
      'Uz to čuvamo tvoj napredak: koje su lekcije pročitane, koja je poslednja otvorena i koje su sačuvane, sa vremenom poslednje promene.',
    ],
  },
  {
    id: 'kolacici',
    heading: 'Kolačići',
    paragraphs: [
      'Jedan kolačić, __Host-l365_session, drži te prijavljenim trideset dana i produžava se dok koristiš aplikaciju. Tokom same prijave postoji i privremeni kolačić od deset minuta koji štiti od lažiranja zahteva. Nema kolačića trećih strana.',
    ],
  },
  {
    id: 'gde',
    heading: 'Gde i koliko dugo',
    paragraphs: [
      'Podaci su na serveru u Helsinkiju, u Evropskoj uniji (Hetzner). Saobraćaj do servera ide preko Cloudflare-a, a prijava preko Google-a. Čuvaju se dok postoji nalog. Statistiku poseta obrađuje i čuva Cloudflare. Rezervne kopije prave se noću i čuvaju četrnaest dana.',
    ],
  },
  {
    id: 'brisanje',
    heading: 'Brisanje',
    paragraphs: [
      'Na strani Nalog postoji dugme Obriši nalog. Briše nalog, napredak i sačuvane lekcije odmah i trajno; iz rezervnih kopija nestaju najkasnije za četrnaest dana. Odjava briše napredak samo iz tog pregledača; nalog ostaje. Isto se dešava kad prijava istekne: pročitane i sačuvane lekcije nestaju iz tog pregledača, a ostaju na nalogu i vraćaju se pri sledećoj prijavi.',
    ],
  },
];

export const PRIVACY_CONTACT_HEADING = 'Kontakt';
export const PRIVACY_CONTACT_BODY = 'Za pitanja o podacima, ili ako želiš da nešto proverimo ili obrišemo umesto tebe:';
