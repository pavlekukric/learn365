/**
 * Privacy page copy. Plain Serbian, no legal register: what is kept, why,
 * where, for how long, and how to delete it. Linked from the footer, the
 * sign-in page and the Google consent screen. Keep it true — every claim
 * here matches the schema in `lib/server/db/schema.ts` and the cookies set
 * by `lib/server/auth/*`.
 */
export const PRIVACY_EYEBROW = 'Privatnost';
export const PRIVACY_TITLE = 'Šta čuvamo, i zašto';
export const PRIVACY_LEDE =
  'History 365 radi i bez naloga. Nalog postoji samo da bi se napredak preneo na druge uređaje. Ovde je, bez sitnih slova, sve što se tada čuva.';
export const PRIVACY_UPDATED = 'Poslednja izmena: 27. septembar 2026.';

export interface PrivacySection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const PRIVACY_SECTIONS: readonly PrivacySection[] = [
  {
    id: 'bez-naloga',
    heading: 'Bez naloga',
    paragraphs: [
      'Dok čitaš bez prijave, ništa ne napušta tvoj pregledač. Pročitane i sačuvane lekcije pamte se u njegovoj lokalnoj memoriji i nestaju kad obrišeš podatke sajta. Nemamo analitiku, kolačiće za praćenje ni reklame.',
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
      'Jedan kolačić, l365_session, drži te prijavljenim trideset dana i produžava se dok koristiš aplikaciju. Tokom same prijave postoji i privremeni kolačić od deset minuta koji štiti od lažiranja zahteva. Nema kolačića trećih strana.',
    ],
  },
  {
    id: 'gde',
    heading: 'Gde i koliko dugo',
    paragraphs: [
      'Podaci su na serveru u Helsinkiju, u Evropskoj uniji (Hetzner). Čuvaju se dok postoji nalog. Rezervne kopije prave se noću i čuvaju četrnaest dana.',
    ],
  },
  {
    id: 'brisanje',
    heading: 'Brisanje',
    paragraphs: [
      'Na strani Nalog postoji dugme Obriši nalog. Briše nalog, napredak i sačuvane lekcije odmah i trajno. Odjava briše napredak samo iz tog pregledača; nalog ostaje. Isto se dešava kad prijava istekne: pročitane i sačuvane lekcije nestaju iz tog pregledača, a ostaju na nalogu i vraćaju se pri sledećoj prijavi.',
    ],
  },
];

export const PRIVACY_CONTACT_HEADING = 'Kontakt';
export const PRIVACY_CONTACT_BODY = 'Za pitanja o podacima, ili ako želiš da nešto proverimo ili obrišemo umesto tebe:';
