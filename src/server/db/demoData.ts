type Formats = 'both' | 'singles' | 'doubles';

type DemoPlayer = Readonly<{
  slug: string;
  name: string;
  age: number;
  rating: number;
  district: string;
  playStyle: string;
  formats: Formats;
  mornings: boolean;
  weekends: boolean;
  freeTonight: boolean;
  wantsDoublesPartner: boolean;
  isNew: boolean;
}>;

type Flags = Partial<
  Pick<DemoPlayer, 'mornings' | 'weekends' | 'freeTonight' | 'wantsDoublesPartner' | 'isNew'>
>;

function player(
  slug: string,
  name: string,
  age: number,
  rating: number,
  district: string,
  playStyle: string,
  formats: Formats,
  flags: Flags = {},
): DemoPlayer {
  return {
    slug,
    name,
    age,
    rating,
    district,
    playStyle,
    formats,
    mornings: false,
    weekends: false,
    freeTonight: false,
    wantsDoublesPartner: false,
    isNew: false,
    ...flags,
  };
}

export const demoPlayers: readonly DemoPlayer[] = [
  player('marta-k', 'Marta K.', 29, 3.5, 'Podgórze', 'Match play', 'both', {
    freeTonight: true,
    mornings: true,
    weekends: true,
  }),
  player('piotr-w', 'Piotr W.', 34, 3.5, 'Kazimierz', 'Rally & drills', 'singles', {
    mornings: true,
  }),
  player('ola-n', 'Ola N.', 26, 3, 'Nowa Huta', 'Tournaments', 'doubles', {
    freeTonight: true,
    wantsDoublesPartner: true,
  }),
  player('kuba-s', 'Kuba S.', 41, 4, 'Krowodrza', 'Match play', 'both', { weekends: true }),
  player('ewa-l', 'Ewa L.', 31, 3.5, 'Stare Miasto', 'Fitness', 'doubles', {
    freeTonight: true,
    wantsDoublesPartner: true,
  }),
  player('tomek-b', 'Tomek B.', 37, 3, 'Dębniki', 'Social', 'both'),
  player('anna-p', 'Anna P.', 28, 3.5, 'Zabłocie', 'Social', 'doubles', {
    isNew: true,
    wantsDoublesPartner: true,
  }),
  player('marek-d', 'Marek D.', 45, 3, 'Prądnik', 'Fitness', 'singles', { mornings: true }),
  player('julia-m', 'Julia M.', 27, 3.5, 'Czyżyny', 'Match play', 'singles', { isNew: true }),
  player('pawel-g', 'Paweł G.', 39, 4, 'Bronowice', 'Rally & drills', 'both', { weekends: true }),
  player('kasia-r', 'Kasia R.', 33, 3, 'Ruczaj', 'Social', 'doubles', {
    wantsDoublesPartner: true,
  }),
  player('michal-t', 'Michał T.', 36, 3.5, 'Wola Justowska', 'Tournaments', 'both', {
    mornings: true,
  }),
  player('dawid-z', 'Dawid Z.', 30, 2.5, 'Podgórze', 'Rally & drills', 'singles', { isNew: true }),
  player('iga-s', 'Iga S.', 24, 2.5, 'Kazimierz', 'Social', 'both', { freeTonight: true }),
  player('adam-f', 'Adam F.', 43, 3.5, 'Prądnik', 'Match play', 'singles', { weekends: true }),
  player('zuza-h', 'Zuza H.', 25, 3, 'Dębniki', 'Fitness', 'doubles', {
    mornings: true,
    wantsDoublesPartner: true,
  }),
  player('bartek-o', 'Bartek O.', 35, 4, 'Stare Miasto', 'Match play', 'singles', {
    freeTonight: true,
  }),
  player('lena-c', 'Lena C.', 32, 4, 'Krowodrza', 'Tournaments', 'both', { weekends: true }),
  player('jan-r', 'Jan R.', 52, 3.5, 'Nowa Huta', 'Rally & drills', 'both', { mornings: true }),
  player('maja-t', 'Maja T.', 29, 4, 'Zabłocie', 'Match play', 'singles', { isNew: true }),
  player('filip-a', 'Filip A.', 38, 4.5, 'Czyżyny', 'Tournaments', 'singles', { weekends: true }),
  player('nina-b', 'Nina B.', 27, 4.5, 'Bronowice', 'Match play', 'both'),
  player('olek-j', 'Olek J.', 34, 4.5, 'Podgórze', 'Tournaments', 'singles', { freeTonight: true }),
  player('hanna-v', 'Hanna V.', 30, 5, 'Stare Miasto', 'Tournaments', 'singles', {
    mornings: true,
    weekends: true,
  }),
];

type DemoGame = Readonly<{
  host: string;
  court: string;
  /** Days from today, or the next Saturday when `saturday` is set. */
  daysAhead: number | 'saturday';
  time: string;
  format: 'singles' | 'doubles' | 'hitting';
  rating: number;
  spots: number;
}>;

export const demoGames: readonly DemoGame[] = [
  {
    host: 'piotr-w',
    court: 'Kazimierz Clay Club',
    daysAhead: 0,
    time: '19:00',
    format: 'singles',
    rating: 3.5,
    spots: 1,
  },
  {
    host: 'kuba-s',
    court: 'Park Jordana',
    daysAhead: 0,
    time: '20:00',
    format: 'singles',
    rating: 4,
    spots: 1,
  },
  {
    host: 'ola-n',
    court: 'Cracovia Tennis Club',
    daysAhead: 1,
    time: '18:30',
    format: 'doubles',
    rating: 3,
    spots: 1,
  },
  {
    host: 'kuba-s',
    court: 'Park Jordana',
    daysAhead: 'saturday',
    time: '09:00',
    format: 'hitting',
    rating: 4,
    spots: 2,
  },
  {
    host: 'piotr-w',
    court: 'Kazimierz Clay Club',
    daysAhead: 16,
    time: '17:30',
    format: 'singles',
    rating: 3.5,
    spots: 1,
  },
  {
    host: 'ewa-l',
    court: 'Park Jordana',
    daysAhead: 16,
    time: '19:00',
    format: 'doubles',
    rating: 3.5,
    spots: 3,
  },
  {
    host: 'marta-k',
    court: 'Cracovia Tennis Club',
    daysAhead: 29,
    time: '18:30',
    format: 'singles',
    rating: 3.5,
    spots: 1,
  },
  {
    host: 'tomek-b',
    court: 'Park Jordana',
    daysAhead: 29,
    time: '20:00',
    format: 'singles',
    rating: 3,
    spots: 1,
  },
];

export const demoTournaments = [
  { name: 'Kraków Autumn Open', court: 'Cracovia Tennis Club', daysAhead: 13 },
  { name: 'Winter Clay Cup', court: 'Kazimierz Clay Club', daysAhead: 26 },
] as const;
