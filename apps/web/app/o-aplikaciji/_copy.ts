/**
 * Editorial copy for the /o-aplikaciji page. Kept here as plain string
 * constants so the owner can iterate copy without touching JSX.
 *
 * Voice: one person runs the site and the lesson texts were prepared with
 * an AI model, so the page never speaks as "we". It speaks impersonally
 * about the project ("Istorija 365 …", passive where natural) and says "ti"
 * to the reader. The lede must not repeat the Home hero line.
 *
 * CONTACT_EMAIL is a Cloudflare Email Routing alias on the production
 * domain that forwards to the owner's inbox (DEPLOY.md §11). It is also the
 * data-rights contact on /privatnost.
 */

import { READING_TIME_LABEL } from '@/lib/copy/readingTime';

export const CONTACT_EMAIL = 'kontakt@istorija365.com';

export const PAGE_EYEBROW = 'O aplikaciji';
export const PAGE_TITLE = 'Tihi vodič kroz istoriju Srbije';
export const PAGE_LEDE =
  'Istorija 365 je dnevni kurs koji istoriju Srbije prikazuje kao jednu povezanu priču: po jedna kratka lekcija za svaki dan, hronološkim redom kroz osam epoha, od praistorije do danas.';

export const MISSION_HEADING = 'Misija';
export const MISSION_BODY = `Namera kursa je da istoriju Srbije izvede iz udžbenika i hronologija i ponudi je kao povezanu, čitljivu priču, dostupnu svakome ko želi da je razume. Polazna pretpostavka je jednostavna: ${READING_TIME_LABEL} dnevno tokom jedne godine dovoljno je za solidnu, hronološki urednu sliku — od najstarijih kultura na Balkanu do savremenog doba. Kurs je namerno spor: ne nudi enciklopedijsku iscrpnost, već stabilan ritam koji se može održati.`;

export const STANDARD_HEADING = 'Urednički standard';
export const STANDARD_BODY =
  'Svaka lekcija je kratka, ali ne i površna. Pisana je za obrazovanu publiku koja se istorijom ne bavi profesionalno: jezik je precizan, ton miran, a datumi i imena proveravaju se i ispravljaju lekciju po lekciju. Tekstovi izbegavaju nacionalnu mitologizaciju i lake sudove o ličnostima i događajima; tamo gde istoriografija nije saglasna, to je jasno naznačeno. Cilj je da, kada završiš lekciju, znaš šta se desilo, zašto je važno i šta se o tome (ne) može pouzdano tvrditi.';

export const SOURCES_HEADING = 'O izvorima';
export const SOURCES_BODY =
  'Lekcije se oslanjaju na uglednu domaću i međunarodnu istoriografiju — akademske preglede, monografije pojedinih perioda i, kada je relevantno, primarne izvore u prevodu. Lekcije koje na kraju imaju blok „Izvori” navode dela na koja se tekst neposredno oslanja. Za svaku epohu postoji i spisak dela i izvora na koje se oslanjala provera činjenica, uz opis kako je provera urađena i gde su njene granice. Ako primetiš grešku, javi je na adresu ispod — svaka prijava se proverava, a ispravka ulazi u lekciju čim se potvrdi.';
export const SOURCES_LINK_LABEL = 'Literatura i provera, po epohama';

export const EDITOR_HEADING = 'Ko stoji iza kursa';
export const EDITOR_BODY =
  'Istorija 365 je projekat jedne osobe, ne redakcije. Tekstove lekcija pripremio je AI model na osnovu domaće i međunarodne istoriografije, a autor sajta ih uređuje i ispravlja. U septembru i oktobru 2026. svih 365 lekcija prošlo je proveru činjenica, sporna mesta i drugu proveru u nezavisnim izvorima, a tekst i jezičku lekturu. Provere su urađene uz pomoć AI modela koji je tražio i čitao izvore; to nije recenzija istoričara i nijedna lekcija još nema imenovanog recenzenta — zato svaka greška koju prijaviš zaista pomaže.';

export const CONTACT_HEADING = 'Kontakt';
export const CONTACT_BODY =
  'Za pitanja, primedbe na sadržaj, prijavu greške ili predloge za buduće lekcije — piši.';
