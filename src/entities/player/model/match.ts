import type { GeoPoint, PlayTime, Player } from './player';

export type PlayerMatch = Readonly<{
  player: Player;
  /** 0 to 100: how well this player fits the viewer. */
  score: number;
  distanceMiles: number;
  sharedPlayTimes: readonly PlayTime[];
  sharedCourts: readonly string[];
}>;

// Points each part of the score is worth. They add up to 100.
const weights = { level: 40, schedule: 30, courts: 15, distance: 15 } as const;

// Distance bands in miles, nearest first, with the share of the distance points they earn.
const distanceBands = [
  { maxMiles: 2, share: 1 },
  { maxMiles: 5, share: 0.7 },
  { maxMiles: 10, share: 0.4 },
] as const;

const earthRadiusMiles = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points (haversine formula). */
export function distanceInMiles(from: GeoPoint, to: GeoPoint): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
}

/** A flexible player shares every play time the other player has. */
function sharedPlayTimesOf(viewer: Player, candidate: Player): readonly PlayTime[] {
  if (candidate.playTimes.includes('flexible')) return viewer.playTimes;
  if (viewer.playTimes.includes('flexible')) return candidate.playTimes;
  return viewer.playTimes.filter((time) => candidate.playTimes.includes(time));
}

// Each half point of rating gap costs a quarter of the level points.
function levelPoints(viewer: Player, candidate: Player): number {
  const gap = Math.abs(viewer.rating - candidate.rating);
  return Math.max(0, weights.level * (1 - gap / 2));
}

function schedulePoints(viewer: Player, sharedPlayTimes: readonly PlayTime[]): number {
  if (viewer.playTimes.length === 0) return 0;
  return weights.schedule * Math.min(1, sharedPlayTimes.length / viewer.playTimes.length);
}

function courtPoints(sharedCourts: readonly string[]): number {
  return sharedCourts.length > 0 ? weights.courts : 0;
}

function distancePoints(distanceMiles: number): number {
  const band = distanceBands.find((candidate) => distanceMiles <= candidate.maxMiles);
  return band === undefined ? 0 : weights.distance * band.share;
}

export function matchPlayer(viewer: Player, candidate: Player): PlayerMatch {
  const distanceMiles = distanceInMiles(viewer.location, candidate.location);
  const sharedPlayTimes = sharedPlayTimesOf(viewer, candidate);
  const sharedCourts = viewer.homeCourts.filter((court) => candidate.homeCourts.includes(court));

  const score =
    levelPoints(viewer, candidate) +
    schedulePoints(viewer, sharedPlayTimes) +
    courtPoints(sharedCourts) +
    distancePoints(distanceMiles);

  return {
    player: candidate,
    score: Math.round(score),
    distanceMiles,
    sharedPlayTimes,
    sharedCourts,
  };
}

/** Every other player, best match first. */
export function rankMatches(viewer: Player, players: readonly Player[]): readonly PlayerMatch[] {
  return players
    .filter((player) => player.id !== viewer.id)
    .map((player) => matchPlayer(viewer, player))
    .toSorted((a, b) => b.score - a.score);
}
