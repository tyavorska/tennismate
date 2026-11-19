import { routes } from './routes';

export const sessionCookieName = 'session';

export const protectedPaths = [
  routes.home,
  routes.players,
  routes.calendar,
  routes.profile,
  routes.chooseCity,
] as const;
