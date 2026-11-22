import { defaultLandingPath } from '../config/routes';

const fallbackPath = defaultLandingPath;

const site = 'http://site.invalid';

// Only same-site paths, so `?returnTo=//evil.example` cannot send the user off the site. The value
// is resolved the way the browser does it, which also drops tabs and newlines ("/\t/evil.example").
export function safeReturnTo(value: string | null | undefined): string {
  if (value === null || value === undefined || !value.startsWith('/')) return fallbackPath;
  if (!URL.canParse(value, site)) return fallbackPath;
  const url = new URL(value, site);
  return url.origin === site ? `${url.pathname}${url.search}${url.hash}` : fallbackPath;
}
