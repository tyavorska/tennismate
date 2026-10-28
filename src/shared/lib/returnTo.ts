const fallbackPath = '/home';

// Only same-site paths, so `?returnTo=//evil.example` cannot send the user off the site.
export function safeReturnTo(value: string | null | undefined): string {
  if (value === null || value === undefined) return fallbackPath;
  const isSameSitePath = value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
  return isSameSitePath ? value : fallbackPath;
}
