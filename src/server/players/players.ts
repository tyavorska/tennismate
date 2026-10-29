import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { playerSchema, type Player } from '@/entities/player';
import type { User } from '@/entities/user';
import { getCurrentUser } from '../auth';

// Sample players until profiles are stored in the database. Parsed so they match the schema.
const samplePlayers: readonly Player[] = z.array(playerSchema).parse([
  {
    id: 'maya-okafor',
    name: 'Maya Okafor',
    rating: 3,
    about: 'Consistent baseliner working on my net game. Happy to rally or play sets.',
    neighborhood: 'Rittenhouse',
    location: { latitude: 39.9496, longitude: -75.1718 },
    lastActiveDaysAgo: 0,
    gamesPlayed: 18,
    readyToPlay: true,
    playTimes: ['weekdayEvening', 'weekends'],
    homeCourts: ['Schuylkill River Park', 'Fairmount Park'],
  },
  {
    id: 'daniel-reyes',
    name: 'Daniel Reyes',
    rating: 3.5,
    about: 'Former high school player getting back into it. Looking for competitive sets.',
    neighborhood: 'Fishtown',
    location: { latitude: 39.9713, longitude: -75.1346 },
    lastActiveDaysAgo: 1,
    gamesPlayed: 31,
    readyToPlay: false,
    playTimes: ['weekdayEvening', 'weekdayMorning'],
    homeCourts: ['Penn Treaty Park', 'Fairmount Park'],
  },
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    rating: 3,
    about: 'Doubles lover. Always up for a hit after work.',
    neighborhood: 'University City',
    location: { latitude: 39.9522, longitude: -75.1932 },
    lastActiveDaysAgo: 2,
    gamesPlayed: 9,
    readyToPlay: true,
    playTimes: ['flexible'],
    homeCourts: ['Penn Hamlin Courts'],
  },
  {
    id: 'sam-whitaker',
    name: 'Sam Whitaker',
    rating: 2.5,
    about: 'Beginner, can hold a rally. Just looking for some practice.',
    neighborhood: 'Northern Liberties',
    location: { latitude: 39.9644, longitude: -75.1416 },
    lastActiveDaysAgo: 17,
    gamesPlayed: 1,
    readyToPlay: false,
    playTimes: ['weekdayDaytime', 'weekends'],
    homeCourts: ['Fairmount Park', 'Seger Park'],
  },
  {
    id: 'lena-kowalski',
    name: 'Lena Kowalski',
    rating: 4,
    about: 'Lefty with a big serve. Training for a USTA league this spring.',
    neighborhood: 'Manayunk',
    location: { latitude: 40.0262, longitude: -75.2249 },
    lastActiveDaysAgo: 3,
    gamesPlayed: 54,
    readyToPlay: true,
    playTimes: ['weekdayMorning', 'weekends'],
    homeCourts: ['Kelly Drive Courts'],
  },
  {
    id: 'marcus-bell',
    name: 'Marcus Bell',
    rating: 3,
    about: 'Weekend warrior. Let’s play a set and grab coffee after.',
    neighborhood: 'South Philly',
    location: { latitude: 39.9259, longitude: -75.1696 },
    lastActiveDaysAgo: 0,
    gamesPlayed: 22,
    readyToPlay: false,
    playTimes: ['weekends'],
    homeCourts: ['FDR Park', 'Seger Park'],
  },
  {
    id: 'aiko-tanaka',
    name: 'Aiko Tanaka',
    rating: 5,
    about: 'Ex-college player. Coaching on the side, open to hitting with motivated players.',
    neighborhood: 'Chestnut Hill',
    location: { latitude: 40.0766, longitude: -75.2077 },
    lastActiveDaysAgo: 6,
    gamesPlayed: 80,
    readyToPlay: false,
    playTimes: ['weekdayDaytime'],
    homeCourts: ['Chestnut Hill Tennis Club'],
  },
  {
    id: 'jordan-price',
    name: 'Jordan Price',
    rating: 3.5,
    about: '',
    neighborhood: 'Old City',
    location: { latitude: 39.9526, longitude: -75.1446 },
    lastActiveDaysAgo: 4,
    gamesPlayed: 12,
    readyToPlay: true,
    playTimes: ['weekdayEvening'],
    homeCourts: ['Schuylkill River Park'],
  },
]);

/** "ana.smith@example.com" becomes "Ana Smith". */
function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  return localPart
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Every account gets the same starter profile until users can edit their own.
function toViewerProfile(user: User): Player {
  return playerSchema.parse({
    id: user.id,
    name: nameFromEmail(user.email),
    rating: 3,
    about: '',
    neighborhood: 'Center City',
    location: { latitude: 39.9526, longitude: -75.1652 },
    lastActiveDaysAgo: 0,
    gamesPlayed: 0,
    readyToPlay: false,
    playTimes: ['weekdayEvening', 'weekends'],
    homeCourts: ['Fairmount Park', 'Schuylkill River Park'],
  });
}

/** The signed-in user's player profile. Cached per request. */
export const getViewer = cache(async (): Promise<Player | undefined> => {
  const user = await getCurrentUser();
  return user && toViewerProfile(user);
});

export function listPlayers(): readonly Player[] {
  return samplePlayers;
}
