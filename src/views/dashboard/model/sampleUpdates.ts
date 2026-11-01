/** Sample content for the "Tennis today" feed until the community, ranking and offers exist. */
export type UpdateCard = {
  readonly kind: string;
  readonly title: string;
  readonly text: string;
};

export type NextGame = {
  readonly weekday: string;
  readonly day: string;
  readonly opponent: string;
  readonly details: string;
  readonly status: string;
};

export type CourtOffer = {
  readonly initials: string;
  readonly title: string;
  readonly venue: string;
  readonly rows: ReadonlyArray<readonly [label: string, value: string]>;
  readonly spots: string;
};

export type Story = {
  readonly place: string;
  readonly title: string;
  readonly people: string;
};

export const updateCards = [
  {
    kind: 'Open games',
    title: '1 open game tonight',
    text: 'Ola · 19:00 at Kazimierz Clay Club. One spot left.',
  },
  {
    kind: 'Tournament',
    title: 'Beginner rally day',
    text: 'Sat 7 Nov · Ruczaj Campus Courts. 7 of 16 spots left.',
  },
  {
    kind: 'Courts',
    title: 'Kazimierz bubble goes up 15 Nov',
    text: 'Clay all winter at Kazimierz Clay Club. December evening slots go fast.',
  },
  {
    kind: 'Ranking',
    title: "You're #11 in the ranking",
    text: '1245 points · 1–1. 1 more confirmed result to verify your level.',
  },
  {
    kind: 'Community',
    title: 'Dmytro: “Need a 4th for doubles this Sunday 18:00 at Podgórze Indoor…”',
    text: 'Looking for players · 12 likes · 4 replies',
  },
] as const satisfies readonly UpdateCard[];

export const nextGames = [
  {
    weekday: 'Sat',
    day: '31',
    opponent: 'vs Oksana',
    details: 'Oct · 10:00 · Błonia Park Tennis',
    status: '✓ Confirmed',
  },
  {
    weekday: 'Thu',
    day: '5',
    opponent: 'vs Bartek + 2',
    details: 'Nov · 19:00 · Podgórze Indoor Arena',
    status: 'Waiting',
  },
] as const satisfies readonly NextGame[];

export const courtOffers = [
  {
    initials: 'RC',
    title: 'Cardio tennis after work',
    venue: 'Ruczaj Campus Courts',
    rows: [
      ['When', 'Tomorrow · 19:00'],
      ['Type', 'Cardio tennis · Kasia'],
      ['Level', 'All levels'],
      ['Price', '55 zł'],
    ],
    spots: '4 spots left',
  },
  {
    initials: 'PI',
    title: 'Doubles match play night',
    venue: 'Podgórze Indoor Arena',
    rows: [
      ['When', 'Sun 1 Nov · 20:00'],
      ['Type', 'Match play night'],
      ['Level', '3.5–4.5'],
      ['Price', '45 zł'],
    ],
    spots: '5 spots left',
  },
] as const satisfies readonly CourtOffer[];

export const stories = [
  { place: 'Ruczaj · 6–4', title: 'First set won', people: 'Natalia · Kuba' },
  { place: 'Kazimierz Clay Club', title: 'Clay all winter', people: 'Marta · Dmytro' },
] as const satisfies readonly Story[];
