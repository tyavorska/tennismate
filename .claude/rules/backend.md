---
paths:
  - 'src/server/**'
  - 'src/app/api/**'
  - 'src/proxy.ts'
  - 'scripts/**'
---

# Backend

## `server/` is backend-only

- Holds database access, external service clients (email, S3, Redis), auth, and server-side env
  parsing.
- Imported **only** from code that runs exclusively on the server: Route Handlers
  (`app/**/route.ts`), Server Actions (`'use server'`), and Server Components. Never from a
  `'use client'` module or anything such a module imports.
- Start every `server/` module with `import 'server-only'` so an accidental client import fails
  the build.
- `server/` may import from `shared/` and from `entities/*` model code (types and Zod schemas) so
  request and response shapes are defined once. It never imports `ui/` segments, features,
  widgets, views, or app.
- Client code reaches server functionality through Route Handlers or Server Actions in `app/`,
  consumed with TanStack Query.

## Layout and decisions

One folder per area: `server/courts`, `server/profiles`, `server/players`, `server/games`,
`server/conversations`, `server/realtime`, `server/auth`, `server/db`, `server/http`. Each exposes an `index.ts`. Other `server/` code and
`app/` import through it. An area may import another area, never create a cycle.

| Decision      | Choice and when to change it                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| API style     | REST Route Handlers. Server Actions only for a simple form mutation with one client. No GraphQL or tRPC.                          |
| Database      | SQLite while there is one server. Move to PostgreSQL before running two instances, and before geo search or heavy chat load.      |
| Auth          | Server-side sessions in a `httpOnly` cookie (only the token hash is stored). JWT only if mobile clients or other services appear. |
| Filtering     | On the client while the loaded list is small. On the server when data is large, or when a value depends on the viewer.            |
| Viewer values | Distance and fit % are computed on the server per viewer (`server/players/matching.ts`). Never stored.                            |
| Realtime      | Socket.IO for messaging (see the `realtime-messaging` skill). Everything else is plain REST.                                      |
| Identifiers   | UUIDs for users, games and other rows. Demo players use fixed UUIDs. Court and district names are unique keys.                    |
| Pagination    | Offset for simple lists. Cursor (`after=<id>`) for lists that grow while read, such as messages.                                  |

## Route Handlers

- **Every handler checks the session itself.** `src/proxy.ts` skips `/api`, so wrap each handler in
  `handleAuthed(operation, run)` from `@/server/http`. It answers `401` with no session and turns a
  thrown `DomainError` into its response. Anything else becomes a logged `server` problem.
- Validate every body, query and path param with Zod before any work (`parseBody`, `parseInput`).
  Path ids are `z.uuid()`. Query dates use `isoDateSchema`. A bad value is a `validation` problem
  with `fieldErrors`.
- Business code throws `DomainError(kind, { message, fieldErrors })`. It never builds HTTP
  responses. Use `notFound` for a missing item, `forbidden` for "exists but not yours" (such as
  deleting someone else's game), `conflict` for a full game or a game that has started.
- Response shapes use the `Problem` body from `shared/api`. Success bodies are plain JSON typed with
  `NextResponse.json<Type>(…)`. Deletes answer `204` with no body.
- `PUT` and `DELETE` are idempotent: saving a saved player, joining a joined game, or leaving a game
  you are not in succeeds and changes nothing.
- `params` is a Promise. Type the context with the global `RouteContext<'/api/…/[id]'>` and
  `await context.params`.
- Authorization is per object, not just per route: check that the row belongs to the user.
- Never return another player's email or coordinates. Players are placed by district centroid, and
  only the distance is returned.

## Database

- Schema changes go through migrations. Follow `.claude/rules/migrations.md`.
- Foreign keys are on, with `ON DELETE CASCADE` for data that belongs to a user. `initialize` runs
  on every module load, so everything in it is safe to repeat.
- `server/db/referenceData.ts` seeds Kraków and its districts in every environment, and made-up
  demo courts everywhere except production (`source = 'demo'`). Real cities and courts come from the
  imports (`.claude/rules/imports.md`). Seeds use `INSERT OR IGNORE`.
- **Demo data is development-only** (`NODE_ENV === 'development'`), idempotent and non-destructive:
  demo games are replaced only once all of them have passed, so a restart never undoes a join.
  Demo players are real `users` rows with the password hash `!`, which no password matches.
- Use `transaction(db, work)` for multi-step writes. When a rule must hold under concurrent writes,
  put it in one SQL statement (joining a game is `INSERT … WHERE taken < spots`), not in
  "read, check, write".
- Parse every row with Zod, as `server/auth/users.ts` does. JSON text columns (`formats`, `times`)
  are parsed with a schema on the way out.
- A derived value is never stored. Spots open come from `spots − participants`. `isNew` comes from
  `created_at`. `online` is `false` until presence exists.
- A profile is created only with a city (`createProfile`). An account without one is sent to
  `/choose-city`.

## Cities

The app is open in several cities. A player only ever sees, and can only act on, their own city.

- **A city is open when it has at least one listed court** (`courts.removed_at IS NULL`). This is
  computed, never stored. Sign-up shows only open cities (`GET /api/cities`, open to everyone), and
  `requireCity` refuses a city that is not open. There is no free-text city. The app starts in
  Europe.
- **Our database is the source of truth for courts.** Cities come from GeoNames and a city's first
  courts come from OpenStreetMap, imported once (`.claude/rules/imports.md`). Clubs will register
  and edit their own courts, so nothing may overwrite a court automatically. `courts.source` says
  where a court came from: `osm`, `manual` (entered by a person or club), `demo`, and later
  `claimed`.
- Every district, court and profile has a `city_id`. Names are unique only inside a city. A profile's
  district must belong to its city, and the database enforces it with a composite foreign key.
- **Isolation is enforced on the server**, in SQL, not in the UI. Every query for players, games,
  courts, districts, saved players, calendar events and tournaments filters by the viewer's
  `city_id` (`requireProfile(user).city.id`). A row from another city answers `notFound`, the same
  as a row that does not exist, so nothing leaks.
- Add a cross-city test whenever a query or handler touches players, games or courts
  (`server/cities/cities.test.ts`, with `addCity` from `server/testing/cities.ts`).
- **A profile always has a city, and there is no default city.** Sign-up has a required City field
  and sends `cityId`. The server checks the city first (so a wrong one never leaves an account
  behind), then creates the user, the profile in that city, and the session.
- An account without a profile (a failed sign-up step, or a future social sign-in) is sent to
  `/choose-city` by `app/(app)/layout.tsx` and by each page. That page has one required field and
  creates the profile with `POST /api/me/profile`. A second call answers `409`, because changing
  city is a different action with a confirm step (`docs/roadmap.md`). Sign-in never asks for a city.
- Server code that needs the city calls `requireProfile(user)`, which answers `forbidden` without a
  profile. Pages use `getProfile(user)` and redirect. Only `createProfile` makes a profile.

## Time

- Store instants as UTC ISO strings (`starts_at`). Store plain dates as `YYYY-MM-DD`.
- Convert with `zonedToUtc`, `toWallClock`, `todayIn` and `nextWeekday` from `@/shared/lib`. Every
  call takes an IANA time zone, which is the **city's** (`viewer.city.timezone`, from
  `cities.timezone`). They follow daylight saving. Never use the server's local time and never
  hard-code a zone outside seed and test data.
- The finder's `Today / Tomorrow / Sat / Sun` is a display of a real date, not data. Only games in
  the next 7 days with one of those names appear in the finder. The calendar shows every date.

## Tests for backend code

- Server tests start with `// @vitest-environment node` and use the in-memory database
  (`DATABASE_PATH=:memory:` in `vitest.config.mts`). Create users with `createUser`, and players
  with `createPlayer(email, cityId?)` from `server/testing/players.ts`. Pass `now` into functions
  that depend on time, so tests do not depend on the clock.
- Test the failure branch: full game, game that has started, wrong owner, unknown id, bad range.
- Pure helpers (`matching`, `schedule`, `krakowTime`) get plain unit tests.
