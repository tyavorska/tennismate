import 'server-only';
import { exactDistanceKm } from '@/shared/lib';
import type { OsmCourt } from './overpass';

export type Venue = Readonly<{
  elements: ReadonlyArray<Readonly<{ type: OsmCourt['type']; id: number }>>;
  latitude: number;
  longitude: number;
  name: string | undefined;
  surface: string | undefined;
  lit: boolean | undefined;
}>;

/** Courts of one club are separate OSM elements a few metres apart. Within this they are one place. */
const venueRadiusKm = 0.1;

function mostCommon(values: readonly string[]): string | undefined {
  const counts = values.reduce<Record<string, number>>(
    (found, value) => ({ ...found, [value]: (found[value] ?? 0) + 1 }),
    {},
  );
  return Object.entries(counts).toSorted((a, b) => b[1] - a[1])[0]?.[0];
}

function toVenue(members: readonly OsmCourt[]): Venue {
  // A named tennis centre gives the name; otherwise the first named court does.
  const named = [...members.filter((court) => court.isCentre), ...members].find(
    (court) => court.name !== undefined,
  );
  const lits = members.flatMap((court) => court.lit ?? []);

  return {
    elements: members.map(({ type, id }) => ({ type, id })),
    latitude: members.reduce((sum, court) => sum + court.latitude, 0) / members.length,
    longitude: members.reduce((sum, court) => sum + court.longitude, 0) / members.length,
    name: named?.name,
    surface: mostCommon(members.flatMap((court) => court.surface ?? [])),
    lit: lits.length === 0 ? undefined : lits.some(Boolean),
  };
}

/** Joins courts that are close together, one step at a time, so a long row of courts is one place. */
export function clusterCourts(courts: readonly OsmCourt[]): readonly Venue[] {
  const group = courts.map((_, index) => index);

  function root(index: number): number {
    let current = index;
    while (group[current] !== current) current = group[current] ?? current;
    return current;
  }

  courts.forEach((a, i) =>
    courts.slice(i + 1).forEach((b, offset) => {
      if (exactDistanceKm(a, b) <= venueRadiusKm) group[root(i)] = root(i + 1 + offset);
    }),
  );

  const members = courts.reduce<Map<number, OsmCourt[]>>((found, court, index) => {
    const key = root(index);
    found.set(key, [...(found.get(key) ?? []), court]);
    return found;
  }, new Map());

  return [...members.values()].map(toVenue);
}
