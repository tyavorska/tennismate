/** Page paths. Every redirect, link and guard reads from here, never from a literal. */
export const routes = {
  landing: '/',
  home: '/home',
  players: '/players',
  calendar: '/calendar',
  profile: '/profile',
  chooseCity: '/choose-city',
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
} as const;

/** Where a player lands after signing in or up, and the fallback for `returnTo`. */
export const defaultLandingPath = routes.players;

/** REST endpoints the client calls. Paths with an id are functions. */
export const apiRoutes = {
  signIn: '/api/auth/sign-in',
  signUp: '/api/auth/sign-up',
  signOut: '/api/auth/sign-out',
  me: '/api/me',
  myProfile: '/api/me/profile',
  savedPlayers: '/api/me/saved-players',
  savedPlayer: (id: string) => `/api/me/saved-players/${id}`,
  games: '/api/games',
  game: (id: string) => `/api/games/${id}`,
  gameParticipation: (id: string) => `/api/games/${id}/participation`,
  courts: '/api/courts',
  calendar: '/api/calendar',
  conversations: '/api/conversations',
  conversationMessages: (id: string) => `/api/conversations/${id}/messages`,
  conversationRead: (id: string) => `/api/conversations/${id}/read`,
} as const;
