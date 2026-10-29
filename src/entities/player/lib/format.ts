const recentActivityLabels: Readonly<Record<number, string>> = {
  0: 'Active today',
  1: 'Active yesterday',
};

export function formatLastActive(daysAgo: number): string {
  return recentActivityLabels[daysAgo] ?? `Active ${daysAgo} days ago`;
}

export function formatGamesPlayed(count: number): string {
  return count === 1 ? 'Played 1 game' : `Played ${count} games`;
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'under 0.1 mi';
  return `${miles.toFixed(1)} mi`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
