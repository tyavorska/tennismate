import 'server-only';

const ratingWeight = 0.7;
const distanceWeight = 0.3;
const ratingSpan = 2;
const distanceSpanKm = 10;

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
