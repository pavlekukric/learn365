/**
 * "Kako funkcioniše" — the three-step contract a first-time reader needs
 * before the first lesson. Shared by the Home block (shown only until the
 * first completed lesson) and the About page (always available), so the
 * two never drift apart.
 *
 * Product rule it states explicitly: "Dan" is the lesson's ordinal, not a
 * calendar date — the reader moves at their own pace and nothing is lost by
 * skipping a day.
 */
export interface HowItWorksStep {
  readonly title: string;
  readonly text: string;
}

export const HOW_IT_WORKS_EYEBROW = 'Kako funkcioniše';
export const HOW_IT_WORKS_TITLE = 'Tri koraka, tvojim tempom.';

export const HOW_IT_WORKS_STEPS: readonly HowItWorksStep[] = [
  {
    title: 'Otvori lekciju',
    text: 'Svaki dan te čeka jedna kratka lekcija, oko osam minuta čitanja.',
  },
  {
    title: 'Označi je kao pročitanu',
    text: 'Jedan klik na kraju teksta. Napredak se pamti u ovom pregledaču, bez naloga.',
  },
  {
    title: 'Sutra nastavi gde si stao',
    text: 'Kurs te uvek vraća na prvu nepročitanu lekciju.',
  },
];

export const HOW_IT_WORKS_NOTE =
  '„Dan” je redni broj lekcije, a ne datum u kalendaru. Ako preskočiš dan, ništa se ne gubi: sutra nastavljaš od iste lekcije.';
