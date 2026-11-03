import 'server-only';

export type Coordinates = Readonly<{ latitude: number; longitude: number }>;

const earthRadiusKm = 6371;
const minimumDistanceKm = 0.5;
const ratingWeight = 0.7;
const distanceWeight = 0.3;
const ratingSpan = 2;
const distanceSpanKm = 10;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance, never below 0.5 km so two players in one district are not "0.0 km" apart. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  const km = 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
  return Math.round(Math.max(minimumDistanceKm, km) * 10) / 10;
}

function closeness(gap: number, span: number): number {
  return Math.max(0, 1 - gap / span);
}

/** 0 to 100: how well a player suits the viewer, mostly by level and then by distance. */
export function fitPercent(viewerRating: number, rating: number, km: number): number {
  const score =
    ratingWeight * closeness(Math.abs(viewerRating - rating), ratingSpan) +
    distanceWeight * closeness(km, distanceSpanKm);
  return Math.round(score * 100);
}
