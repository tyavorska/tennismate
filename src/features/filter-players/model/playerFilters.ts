import {
  ntrpRatingSchema,
  type MatchTime,
  type NtrpRating,
  type OpenGame,
  type PlayerListing,
  type PlayFormat,
} from '@/entities/player';

export const ladderRungs: readonly NtrpRating[] = [2.5, 3, 3.5, 4, 4.5, 5].map((rating) =>
  ntrpRatingSchema.parse(rating),
);

export type LevelFilter = 'all' | NtrpRating;

export const listIds = [
  'atYourLevel',
  'freeTonight',
  'closestToYou',
  'needsDoublesPartner',
  'stepUpLevel',
  'newInKrakow',
  'savedPlayers',
] as const;
export type ListId = (typeof listIds)[number];

export const listLabels = {
  atYourLevel: 'At your level',
  freeTonight: 'Free tonight',
  closestToYou: 'Closest to you',
  needsDoublesPartner: 'Needs a doubles partner',
  stepUpLevel: 'Step up a level',
  newInKrakow: 'New in Kraków',
  savedPlayers: 'Saved players',
} as const satisfies Record<ListId, string>;

export type PlayerFilters = Readonly<{
  level: LevelFilter;
  query: string;
  formats: ReadonlySet<PlayFormat>;
  times: ReadonlySet<MatchTime>;
  /** The districts to show. Empty, together with no courts, means all of Kraków. */
  districts: ReadonlySet<string>;
  /** Courts to show games at, and players from the districts they are in. */
  courts: ReadonlySet<string>;
  lists: ReadonlySet<ListId>;
}>;

export type CourtRef = Readonly<{ name: string; district: string }>;

export type FilterContext = Readonly<{
  viewerRating: NtrpRating;
  savedIds: ReadonlySet<string>;
  courts: readonly CourtRef[];
}>;

export type PlayerSort = 'fit' | 'distance' | 'level';

export const emptyFilters: PlayerFilters = {
  level: 'all',
  query: '',
  formats: new Set(),
  times: new Set(),
  districts: new Set(),
  courts: new Set(),
  lists: new Set(),
};

export const defaultFilters: PlayerFilters = { ...emptyFilters, lists: new Set(['atYourLevel']) };

function matchesAny<T>(selected: ReadonlySet<T>, has: (value: T) => boolean): boolean {
  return selected.size === 0 || [...selected].some(has);
}

function includesText(query: string, ...fields: readonly string[]): boolean {
  const needle = query.trim().toLowerCase();
  return needle === '' || fields.some((field) => field.toLowerCase().includes(needle));
}

function isAtLevel(rating: NtrpRating, viewerRating: NtrpRating): boolean {
  return Math.abs(rating - viewerRating) <= 0.5;
}

function isStepUp(rating: NtrpRating, viewerRating: NtrpRating): boolean {
  return rating > viewerRating && rating <= viewerRating + 1;
}

const playerListChecks = {
  atYourLevel: (player, context) => isAtLevel(player.rating, context.viewerRating),
  freeTonight: (player) => player.freeTonight,
  closestToYou: () => true,
  needsDoublesPartner: (player) => player.wantsDoublesPartner,
  stepUpLevel: (player, context) => isStepUp(player.rating, context.viewerRating),
  newInKrakow: (player) => player.isNew,
  savedPlayers: (player, context) => context.savedIds.has(player.id),
} as const satisfies Record<ListId, (player: PlayerListing, context: FilterContext) => boolean>;

// Lists with no meaning for a game (new players, saved players) leave games alone.
const gameListChecks = {
  atYourLevel: (game, context) => isAtLevel(game.rating, context.viewerRating),
  freeTonight: (game) => game.day === 'Today',
  closestToYou: () => true,
  needsDoublesPartner: (game) => game.format === 'doubles',
  stepUpLevel: (game, context) => isStepUp(game.rating, context.viewerRating),
  newInKrakow: () => true,
  savedPlayers: () => true,
} as const satisfies Record<ListId, (game: OpenGame, context: FilterContext) => boolean>;

const gameTimeChecks = {
  tonight: (game) => game.day === 'Today',
  mornings: (game) => game.time < '12:00',
  weekends: (game) => game.day === 'Sat' || game.day === 'Sun',
} as const satisfies Record<MatchTime, (game: OpenGame) => boolean>;

function matchesLevel(rating: NtrpRating, level: LevelFilter): boolean {
  return level === 'all' || rating === level;
}

/** A game is at one court; a player is only in a district, so a chosen court stands for its district. */
function matchesPlace(
  place: Readonly<{ district: string; court?: string }>,
  filters: PlayerFilters,
  courts: readonly CourtRef[],
): boolean {
  if (filters.districts.size === 0 && filters.courts.size === 0) return true;
  if (filters.districts.has(place.district)) return true;
  if (place.court !== undefined) return filters.courts.has(place.court);
  return courts.some(
    (court) => filters.courts.has(court.name) && court.district === place.district,
  );
}

export function filterPlayers(
  players: readonly PlayerListing[],
  filters: PlayerFilters,
  context: FilterContext,
): readonly PlayerListing[] {
  return players.filter(
    (player) =>
      matchesLevel(player.rating, filters.level) &&
      matchesPlace(player, filters, context.courts) &&
      includesText(filters.query, player.name, player.district, player.playStyle) &&
      matchesAny(filters.formats, (format) => player.formats.includes(format)) &&
      matchesAny(filters.times, (time) =>
        time === 'tonight' ? player.freeTonight : player.times.includes(time),
      ) &&
      [...filters.lists].every((list) => playerListChecks[list](player, context)),
  );
}

export function filterGames(
  games: readonly OpenGame[],
  filters: PlayerFilters,
  context: FilterContext,
): readonly OpenGame[] {
  return games.filter(
    (game) =>
      matchesLevel(game.rating, filters.level) &&
      matchesPlace(game, filters, context.courts) &&
      includesText(filters.query, game.hostName, game.court, game.district) &&
      matchesAny(filters.formats, (format) => game.format === format) &&
      matchesAny(filters.times, (time) => gameTimeChecks[time](game)) &&
      [...filters.lists].every((list) => gameListChecks[list](game, context)),
  );
}

const sorters = {
  fit: (a, b) => b.fitPercent - a.fitPercent,
  distance: (a, b) => a.distanceKm - b.distanceKm,
  level: (a, b) => b.rating - a.rating,
} as const satisfies Record<PlayerSort, (a: PlayerListing, b: PlayerListing) => number>;

export function sortPlayers(
  players: readonly PlayerListing[],
  sort: PlayerSort,
): readonly PlayerListing[] {
  return [...players].sort(sorters[sort]);
}

export type LadderRung = Readonly<{ rating: NtrpRating; count: number }>;

export function ladderOf(players: readonly PlayerListing[]): readonly LadderRung[] {
  return ladderRungs.map((rating) => ({
    rating,
    count: players.filter((player) => player.rating === rating).length,
  }));
}

export function districtsOf(players: readonly PlayerListing[]): readonly string[] {
  return [...new Set(players.map((player) => player.district))].sort((a, b) =>
    a.localeCompare(b, 'pl'),
  );
}

export type PlaceRow = Readonly<{
  key: string;
  label: string;
  kind: 'district' | 'court';
}>;

const byName = (a: string, b: string): number => a.localeCompare(b, 'pl');

/** Districts in alphabetical order, each followed by its courts. */
export function placeRowsOf(
  players: readonly PlayerListing[],
  courts: readonly CourtRef[],
): readonly PlaceRow[] {
  const districts = [
    ...new Set([...players.map((player) => player.district), ...courts.map((c) => c.district)]),
  ].sort(byName);
  return districts.flatMap((district) => [
    { key: `district:${district}`, label: district, kind: 'district' } as const,
    ...courts
      .filter((court) => court.district === district)
      .map((court) => court.name)
      .sort(byName)
      .map((name) => ({ key: `court:${name}`, label: name, kind: 'court' }) as const),
  ]);
}

/** Splits the selected keys of the place list back into districts and courts. */
export function placesFromKeys(keys: Iterable<string>): {
  districts: ReadonlySet<string>;
  courts: ReadonlySet<string>;
} {
  const all = [...keys];
  const pick = (prefix: string): ReadonlySet<string> =>
    new Set(all.filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length)));
  return { districts: pick('district:'), courts: pick('court:') };
}

export function placeKeysOf(filters: PlayerFilters): ReadonlySet<string> {
  return new Set([
    ...[...filters.districts].map((district) => `district:${district}`),
    ...[...filters.courts].map((court) => `court:${court}`),
  ]);
}
