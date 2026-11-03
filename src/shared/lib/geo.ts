export type Coordinates = Readonly<{ latitude: number; longitude: number }>;

const earthRadiusKm = 6371;
const minimumDistanceKm = 0.5;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function exactDistanceKm(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

/** Distance for display, never below 0.5 km so two places in one district are not "0.0 km" apart. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  return Math.round(Math.max(minimumDistanceKm, exactDistanceKm(from, to)) * 10) / 10;
}
