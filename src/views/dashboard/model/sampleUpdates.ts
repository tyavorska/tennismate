/** Sample content for the home page until the community, ranking and offers exist. */
export type FreePlayer = {
  readonly name: string;
  readonly initials: string;
};

export type OpenGameUpdate = {
  readonly host: string;
  readonly time: string;
  readonly court: string;
};

export type CourtOffer = {
  readonly title: string;
  readonly details: string;
};

export type Story = {
  readonly name: string;
};

export const freeToday = {
  count: 6,
  neighborhood: 'Kazimierz',
  players: [
    { name: 'Marta', initials: 'MK' },
    { name: 'Piotr', initials: 'PW' },
    { name: 'Ola', initials: 'ON' },
    { name: 'Kuba', initials: 'KS' },
  ],
} as const satisfies { count: number; neighborhood: string; players: readonly FreePlayer[] };

export const openGamesTonight = {
  count: 2,
  host: 'Piotr W.',
  time: '19:00',
  court: 'Kazimierz Clay Club',
  hosts: [
    { name: 'Piotr', initials: 'PW' },
    { name: 'Ola', initials: 'ON' },
  ],
} as const;

export const infoCards = [
  {
    kind: 'Tournament',
    title: 'Kraków Autumn Open',
    text: '15 Nov · Cracovia Tennis Club. 6 of 32 spots left.',
  },
  {
    kind: 'Courts',
    title: 'Kazimierz bubble goes up 15 Nov',
    text: 'Clay all winter at Kazimierz Clay Club. December evening slots go fast.',
  },
  {
    kind: 'Ranking',
    title: "You're #12 in Kraków",
    text: '420 points · 8–5. 2 more confirmed results to verify your level.',
  },
  {
    kind: 'Community',
    title: 'Ola N.: “Anyone for doubles on Saturday morning?”',
    text: 'Doubles · 14 likes · 6 replies',
    faces: [{ name: 'Ola', initials: 'ON' }],
  },
] as const;

export const courtOffers = [
  { title: 'Winter clay pass', details: 'Kazimierz Clay Club · from 60 zł/h' },
  { title: 'Morning hitting hour', details: 'Cracovia Tennis Club · 2 spots' },
  { title: 'Doubles evening', details: 'Park Jordana · Fri 18:00' },
] as const satisfies readonly CourtOffer[];

export const stories = [
  { name: 'Marta K.' },
  { name: 'Piotr W.' },
  { name: 'Ola N.' },
  { name: 'Kuba S.' },
] as const satisfies readonly Story[];
