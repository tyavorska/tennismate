import { z } from 'zod';
import {
  ntrpRatingSchema,
  openGameSchema,
  playerListingSchema,
  type OpenGame,
  type PlayerListing,
} from '@/entities/player';

/** Sample data for the Players page until players, games and messages come from the backend. */
const listings: ReadonlyArray<
  [
    id: string,
    name: string,
    age: number,
    rating: number,
    district: string,
    km: number,
    fit: number,
    style: string,
    formats: 'both' | 'singles' | 'doubles',
    flags: string,
  ]
> = [
  ['marta-k', 'Marta K.', 29, 3.5, 'Podgórze', 1.8, 94, 'Match play', 'both', 'tonight online m w'],
  ['piotr-w', 'Piotr W.', 34, 3.5, 'Kazimierz', 0.9, 91, 'Rally & drills', 'singles', 'online m'],
  ['ola-n', 'Ola N.', 26, 3, 'Nowa Huta', 4.2, 88, 'Tournaments', 'doubles', 'tonight doubles'],
  ['kuba-s', 'Kuba S.', 41, 4, 'Krowodrza', 2.6, 86, 'Match play', 'both', 'online w'],
  ['ewa-l', 'Ewa L.', 31, 3.5, 'Stare Miasto', 1.1, 85, 'Fitness', 'doubles', 'tonight doubles'],
  ['tomek-b', 'Tomek B.', 37, 3, 'Dębniki', 2.9, 83, 'Social', 'both', 'online'],
  ['anna-p', 'Anna P.', 28, 3.5, 'Zabłocie', 3.1, 82, 'Social', 'doubles', 'new doubles'],
  ['marek-d', 'Marek D.', 45, 3, 'Prądnik', 3.8, 80, 'Fitness', 'singles', 'm'],
  ['julia-m', 'Julia M.', 27, 3.5, 'Czyżyny', 3.9, 79, 'Match play', 'singles', 'new online'],
  ['pawel-g', 'Paweł G.', 39, 4, 'Bronowice', 4.4, 78, 'Rally & drills', 'both', 'w'],
  ['kasia-r', 'Kasia R.', 33, 3, 'Ruczaj', 5, 77, 'Social', 'doubles', 'doubles'],
  ['michal-t', 'Michał T.', 36, 3.5, 'Wola Justowska', 5.2, 75, 'Tournaments', 'both', 'm'],
  ['dawid-z', 'Dawid Z.', 30, 2.5, 'Podgórze', 2.2, 74, 'Rally & drills', 'singles', 'new'],
  ['iga-s', 'Iga S.', 24, 2.5, 'Kazimierz', 1.4, 73, 'Social', 'both', 'tonight online'],
  ['adam-f', 'Adam F.', 43, 3.5, 'Prądnik', 4.1, 72, 'Match play', 'singles', 'w'],
  ['zuza-h', 'Zuza H.', 25, 3, 'Dębniki', 3.3, 71, 'Fitness', 'doubles', 'doubles m'],
  [
    'bartek-o',
    'Bartek O.',
    35,
    4,
    'Stare Miasto',
    1.7,
    70,
    'Match play',
    'singles',
    'online tonight',
  ],
  ['lena-c', 'Lena C.', 32, 4, 'Krowodrza', 2.4, 69, 'Tournaments', 'both', 'w'],
  ['jan-r', 'Jan R.', 52, 3.5, 'Nowa Huta', 6, 68, 'Rally & drills', 'both', 'm'],
  ['maja-t', 'Maja T.', 29, 4, 'Zabłocie', 3.4, 67, 'Match play', 'singles', 'new'],
  ['filip-a', 'Filip A.', 38, 4.5, 'Czyżyny', 4.6, 66, 'Tournaments', 'singles', 'w'],
  ['nina-b', 'Nina B.', 27, 4.5, 'Bronowice', 4.8, 65, 'Match play', 'both', 'online'],
  ['olek-j', 'Olek J.', 34, 4.5, 'Podgórze', 2.1, 64, 'Tournaments', 'singles', 'tonight'],
  ['hanna-v', 'Hanna V.', 30, 5, 'Stare Miasto', 1.3, 62, 'Tournaments', 'singles', 'm w'],
];

const formatsByKey = {
  both: ['singles', 'doubles'],
  singles: ['singles'],
  doubles: ['doubles'],
} as const;

function parseListing([
  id,
  name,
  age,
  rating,
  district,
  km,
  fit,
  style,
  formats,
  flags,
]: (typeof listings)[number]) {
  const has = new Set(flags.split(' '));
  return {
    id,
    name,
    age,
    rating,
    district,
    distanceKm: km,
    fitPercent: fit,
    playStyle: style,
    formats: formatsByKey[formats],
    times: [...(has.has('m') ? ['mornings'] : []), ...(has.has('w') ? ['weekends'] : [])],
    freeTonight: has.has('tonight'),
    online: has.has('online'),
    isNew: has.has('new'),
    wantsDoublesPartner: has.has('doubles'),
  };
}

export const samplePlayers: readonly PlayerListing[] = z
  .array(playerListingSchema)
  .parse(listings.map(parseListing));

export const sampleGames: readonly OpenGame[] = z.array(openGameSchema).parse([
  {
    id: 'game-piotr',
    hostName: 'Piotr W.',
    hostInitials: 'PW',
    rating: 3.5,
    format: 'singles',
    day: 'Today',
    time: '19:00',
    court: 'Kazimierz Clay Club',
    district: 'Kazimierz',
    spotsOpen: 1,
    isMine: false,
  },
  {
    id: 'game-ola',
    hostName: 'Ola N.',
    hostInitials: 'ON',
    rating: 3,
    format: 'doubles',
    day: 'Tomorrow',
    time: '18:30',
    court: 'Cracovia Tennis Club',
    district: 'Stare Miasto',
    spotsOpen: 1,
    isMine: false,
  },
  {
    id: 'game-kuba',
    hostName: 'Kuba S.',
    hostInitials: 'KS',
    rating: 4,
    format: 'hitting',
    day: 'Sat',
    time: '10:00',
    court: 'Park Jordana',
    district: 'Krowodrza',
    spotsOpen: 2,
    isMine: false,
  },
]);

export const sampleCourts = [
  { name: 'Kazimierz Clay Club', district: 'Kazimierz' },
  { name: 'Cracovia Tennis Club', district: 'Stare Miasto' },
  { name: 'Błonia Park Tennis', district: 'Stare Miasto' },
  { name: 'Park Jordana', district: 'Krowodrza' },
  { name: 'Podgórze Indoor Arena', district: 'Podgórze' },
  { name: 'Ruczaj Campus Courts', district: 'Ruczaj' },
  { name: 'Zabłocie Rooftop Courts', district: 'Zabłocie' },
  { name: 'Nowa Huta Tennis Center', district: 'Nowa Huta' },
  { name: 'Prądnik Sports Club', district: 'Prądnik' },
  { name: 'Czyżyny Courts', district: 'Czyżyny' },
  { name: 'Bronowice Tennis Club', district: 'Bronowice' },
  { name: 'Dębniki Riverside Courts', district: 'Dębniki' },
  { name: 'Wola Justowska Tennis Park', district: 'Wola Justowska' },
] as const;

export const sampleViewerRating = ntrpRatingSchema.parse(3.5);
