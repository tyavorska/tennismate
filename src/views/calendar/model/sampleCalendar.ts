import { z } from 'zod';
import { freePlayerSchema, type FreePlayer } from '@/entities/game';

/** Sample players for the "who's free" faces until availability comes from the backend. */
export const sampleFreePlayers: readonly FreePlayer[] = z.array(freePlayerSchema).parse([
  {
    id: 'marta-k',
    name: 'Marta K.',
    initials: 'MK',
    rating: 3.5,
    window: 'Free 18:00–21:00',
    district: 'Podgórze',
    weekdays: [0, 2, 4, 5],
  },
  {
    id: 'ola-n',
    name: 'Ola N.',
    initials: 'ON',
    rating: 3,
    window: 'Free 17:00–20:00',
    district: 'Nowa Huta',
    weekdays: [0, 1, 3, 5],
  },
  {
    id: 'ewa-l',
    name: 'Ewa L.',
    initials: 'EL',
    rating: 3.5,
    window: 'Free 19:00–22:00',
    district: 'Stare Miasto',
    weekdays: [0, 2, 6],
  },
  {
    id: 'tomek-b',
    name: 'Tomek B.',
    initials: 'TB',
    rating: 3,
    window: 'Free 18:30–21:00',
    district: 'Dębniki',
    weekdays: [0, 1, 4],
  },
  {
    id: 'kuba-s',
    name: 'Kuba S.',
    initials: 'KS',
    rating: 4,
    window: 'Free 18:00–22:00',
    district: 'Krowodrza',
    weekdays: [0, 3, 5, 6],
  },
  {
    id: 'piotr-w',
    name: 'Piotr W.',
    initials: 'PW',
    rating: 3.5,
    window: 'Free 19:00–21:30',
    district: 'Kazimierz',
    weekdays: [0, 2, 3, 6],
  },
]);
