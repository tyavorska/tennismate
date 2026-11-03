import 'server-only';
import { z } from 'zod';

const endpoint = 'https://overpass-api.de/api/interpreter';
const userAgent = 'TennisMate court import (+https://github.com/tyavorska/tennismate)';
const timeoutMs = 120_000;

const elementSchema = z.object({
  type: z.enum(['node', 'way', 'relation']),
  id: z.number().int(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const responseSchema = z.object({ elements: z.array(elementSchema) });

export type OsmElementType = z.infer<typeof elementSchema>['type'];

export type OsmCourt = Readonly<{
  type: OsmElementType;
  id: number;
  latitude: number;
  longitude: number;
  isCentre: boolean;
  name: string | undefined;
  surface: string | undefined;
  lit: boolean | undefined;
}>;

export type OsmPlace = Readonly<{ name: string; latitude: number; longitude: number }>;

export type OsmData = Readonly<{ courts: readonly OsmCourt[]; places: readonly OsmPlace[] }>;

type CityArea = Readonly<{ latitude: number; longitude: number; population: number | null }>;

// How far from the middle of a city to look. A bigger city spreads further.
const radiusByPopulation = [
  { upTo: 100_000, km: 6 },
  { upTo: 500_000, km: 10 },
  { upTo: 1_500_000, km: 15 },
] as const;
const largestRadiusKm = 20;

export function radiusKmFor(population: number | null): number {
  const size = population ?? 0;
  return radiusByPopulation.find((step) => size < step.upTo)?.km ?? largestRadiusKm;
}

/** Tennis pitches and tennis centres around a city, and the suburb points used as its districts. */
export function courtsQuery(city: CityArea): string {
  const around = `around:${radiusKmFor(city.population) * 1000},${city.latitude},${city.longitude}`;
  return `[out:json][timeout:90];
(
  nwr(${around})["sport"="tennis"]["leisure"~"^(pitch|sports_centre)$"];
  node(${around})["place"~"^(suburb|city_district)$"];
);
out center tags;`;
}

function pointOf(element: z.infer<typeof elementSchema>): { lat: number; lon: number } | undefined {
  if (element.lat !== undefined && element.lon !== undefined) {
    return { lat: element.lat, lon: element.lon };
  }
  return element.center;
}

/** Reads an Overpass answer into courts and places. Elements without a position are left out. */
export function parseOverpass(json: z.core.util.JSONType): OsmData {
  const { elements } = responseSchema.parse(json);
  const courts: OsmCourt[] = [];
  const places: OsmPlace[] = [];

  elements.forEach((element) => {
    const point = pointOf(element);
    const tags = element.tags ?? {};
    if (point === undefined) return;

    if (tags.sport === 'tennis' && (tags.leisure === 'pitch' || tags.leisure === 'sports_centre')) {
      courts.push({
        type: element.type,
        id: element.id,
        latitude: point.lat,
        longitude: point.lon,
        isCentre: tags.leisure === 'sports_centre',
        name: tags.name?.trim() || undefined,
        surface: tags.surface,
        lit: tags.lit === undefined ? undefined : tags.lit === 'yes',
      });
      return;
    }

    const placeName = tags.name?.trim();
    if ((tags.place === 'suburb' || tags.place === 'city_district') && placeName) {
      places.push({ name: placeName, latitude: point.lat, longitude: point.lon });
    }
  });

  return { courts, places };
}

/** One request to the public Overpass server. Run it rarely, and never from a user's request. */
export async function fetchOverpass(query: string): Promise<z.core.util.JSONType> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'User-Agent': userAgent, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Overpass answered ${response.status}. Wait a few minutes and try again.`);
  }
  return response.json();
}
