@AGENTS.md

# TennisMate

TennisMate is a Next.js web app for tennis players to find playing partners and organize matches.
This file defines how the codebase is organized and the conventions every change must follow.

The first line imports `AGENTS.md`, a file managed by Next.js. It points to the framework docs
bundled in `node_modules/next/dist/docs/`. Read the relevant guide there before using a Next.js API;
this Next.js version differs from older training data.

## Stack

| Concern             | Choice                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Framework           | Next.js 16, App Router, Turbopack (the default bundler, no flag needed) |
| UI                  | React 19, TypeScript in strict mode                                     |
| Styling             | CSS Modules only                                                        |
| Client server-state | TanStack Query                                                          |
| Validation          | Zod                                                                     |
| Forms               | React Hook Form (`useForm` + `zodResolver` from `@hookform/resolvers`)  |
| HTTP API            | REST through Next Route Handlers (`app/api/**/route.ts`)                |
| Database            | SQLite (`node:sqlite`) now; PostgreSQL when a second instance is needed |
| Realtime messaging  | Socket.IO in a separate Node process (not installed yet)                |
| Tests               | Vitest + Testing Library, co-located with the code under test           |
| Lint / format       | ESLint (`eslint-config-next` + `eslint-config-prettier`), Prettier      |
| Runtime             | Node 24 LTS (see `.nvmrc`), npm                                         |

`socket.io` and `socket.io-client` are the chosen realtime libraries but are not installed yet. Add
them with the first messaging code. Do not substitute alternatives (no `ws`, SSE or polling for
chat).

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # production build
npm run lint         # ESLint and Stylelint
npm run typecheck    # next typegen, then tsc --noEmit
npm test             # Vitest, one run
npm run format       # Prettier, writes changes
npm run format:check # Prettier, read-only (CI)
```

`lint`, `typecheck`, `format:check`, and `test` must all pass before a commit. After adding or
renaming a Route Handler, run `typecheck` once so `RouteContext` types are regenerated.

## Architecture: Feature-Sliced Design

`src/` follows Feature-Sliced Design (FSD). Layers, top to bottom:

```
src/
├── app/        Next.js App Router: routing files, root layout, providers, global styles
├── views/      Route-level page compositions (FSD "pages"; renamed because Next reserves pages/)
├── widgets/    Self-contained UI blocks composed from features and entities (header, match list)
├── features/   User interactions and business actions (create-match, filter-players)
├── entities/   Business objects: types, schemas, queries, base UI (player, match, court)
├── shared/     Reusable code with no business knowledge (ui kit, api client, lib, config)
└── server/     Backend-only code: database, external services, auth. Never imported by client code.
```

### Import rules

- **Imports flow downward only**: `app → views → widgets → features → entities → shared`. A layer
  may import from any layer below it, never from a layer above.
- **No imports across slices on the same layer.** `features/create-match` must not import
  `features/filter-players`. Move the shared code down to `entities/` or `shared/`.
- **Import through the public API.** Every slice exposes an `index.ts`. Import `@/entities/player`,
  never `@/entities/player/api/playerQueries`.
- **`app/` and `shared/` have no slices.** `app/` holds only routing and global setup. `shared/` is
  flat (`ui/`, `api/`, `lib/`, `config/`, `hooks/`, `testing/`) and knows nothing about the domain.
- Use the `@/` alias (maps to `src/`). No deep relative paths across layers.

### Slice layout and segments

```
features/create-match/
├── ui/       CreateMatchForm.tsx, CreateMatchForm.module.css
├── model/    createMatchSchema.ts (Zod), useCreateMatch.ts — business rules live here
├── api/      createMatchApi.ts (HTTP calls, query and mutation definitions)
├── lib/      helpers specific to this slice
└── index.ts  public API
```

Business rules belong in `model/` (or `entities/*/model`), never inside JSX or an API client.

### `server/` is backend-only

- Holds database access, external service clients (email, S3, Redis), auth, and server-side env
  parsing.
- Imported **only** from code that runs exclusively on the server: Route Handlers
  (`app/**/route.ts`), Server Actions (`'use server'`), and Server Components. Never from a
  `'use client'` module or anything such a module imports.
- Start every `server/` module with `import 'server-only'` so an accidental client import fails
  the build. Add the `server-only` package together with the first module.
- `server/` may import from `shared/` and from `entities/*` model code (types and Zod schemas) so
  request and response shapes are defined once. It never imports `ui/` segments, features,
  widgets, views, or app.
- Client code reaches server functionality through Route Handlers or Server Actions in `app/`,
  consumed with TanStack Query.

## Backend

### Layout and decisions

One folder per area: `server/courts`, `server/profiles`, `server/players`, `server/games`,
`server/auth`, `server/db`, `server/http`. Each exposes an `index.ts`. Other `server/` code and
`app/` import through it. An area may import another area, never create a cycle.

| Decision      | Choice and when to change it                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| API style     | REST Route Handlers. Server Actions only for a simple form mutation with one client. No GraphQL or tRPC.                          |
| Database      | SQLite while there is one server. Move to PostgreSQL before running two instances, and before geo search or heavy chat load.      |
| Auth          | Server-side sessions in a `httpOnly` cookie (only the token hash is stored). JWT only if mobile clients or other services appear. |
| Filtering     | On the client while the loaded list is small. On the server when data is large, or when a value depends on the viewer.            |
| Viewer values | Distance and fit % are computed on the server per viewer (`server/players/matching.ts`). Never stored.                            |
| Realtime      | Socket.IO for messaging (see below). Everything else is plain REST.                                                               |
| Identifiers   | UUIDs for users, games and other rows. Demo players use fixed UUIDs. Court and district names are unique keys.                    |
| Pagination    | Offset for simple lists. Cursor (`after=<id>`) for lists that grow while read, such as messages.                                  |

### Route Handlers

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

### Database

- **The schema changes only through migrations** in `server/db/migrations/`, numbered `001_…`,
  `002_…` and listed in `migrations/index.ts`. `migrate` runs on every start, applies what is
  missing in order, and stores the version in `PRAGMA user_version`.
- **Never edit a migration that has been merged.** Add the next one. `001_baseline` is the schema
  from before migrations existed. Do not add to it.
- Each migration runs in its own transaction with foreign keys off, then `foreign_key_check` must
  be empty, or the whole migration is undone. To change a table, rebuild it: create the new table,
  copy the rows, drop the old one, rename. Keep ids when other tables point at them.
- Test every migration with `migrate.test.ts`: from an empty database, and from the previous schema
  with rows in it. Check that rows and links survive. Before running one on a real database, copy
  the file.
- Foreign keys are on, with `ON DELETE CASCADE` for data that belongs to a user. `initialize` runs
  on every module load, so everything in it is safe to repeat.
- Reference data (cities, districts, courts) lives in `server/db/referenceData.ts` and is seeded in
  every environment with `INSERT OR IGNORE`.
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
- Accounts made before profiles existed get a profile on first use (`ensureProfile`).

### Cities

The app is open in several cities. A player only ever sees, and can only act on, their own city.

- **A city is curated.** It goes into `referenceData.ts` only once its districts and courts are
  listed. Sign-up shows this list (`GET /api/cities`, open to everyone). There is no free-text city.
  Players in a missing city can ask for it (`city_requests`, not built yet).
- Every district, court and profile has a `city_id`. Names are unique only inside a city. A profile's
  district must belong to its city, and the database enforces it with a composite foreign key.
- **Isolation is enforced on the server**, in SQL, not in the UI. Every query for players, games,
  courts, districts, saved players, calendar events and tournaments filters by the viewer's
  `city_id` (`ensureProfile(user).city.id`). A row from another city answers `notFound`, the same
  as a row that does not exist, so nothing leaks.
- Add a cross-city test whenever a query or handler touches players, games or courts
  (`server/cities/cities.test.ts`, with `addCity` from `server/testing/cities.ts`).
- The city shown in the UI comes from the profile (`viewer.city`). Do not hard-code a city name.
- New accounts start in the first city, in the district nearest its centre, until sign-up asks for
  one. Pass a `cityId` to `ensureProfile` for that.

**Planned, not built yet:**

- City field in the sign-up form, and one `/choose-city` page for accounts with no city (social
  sign-in). Sign-in itself never asks for a city.
- **Changing city** (profile settings) needs a confirm step that shows the impact first
  (`GET /api/me/city/impact`). `PUT /api/me/city` with `confirm: true` then, in one transaction,
  changes the city, **cancels** the games the player hosts, removes them from the games they joined,
  and writes `notifications` rows for everyone affected. The server answers `409 conflict` with the
  same summary when there are affected games and `confirm` is missing. Games are cancelled
  (`cancelled_at`), never deleted. Notifications are written in the same transaction and delivered
  to the messenger afterwards (outbox), so none are lost.
- Saved players in another city stay saved but are hidden.
- Open question: a limit on how often the city can change.
- Remove the hard-coded "Kraków" from the UI: the Players page heading, "All of Kraków" and the
  "New in Kraków" list in the filters, the level quiz text, and the calendar lead.
- `cities.timezone` is stored, but the time helpers in `@/shared/lib` still use `Europe/Warsaw`.
  Make them take the city's zone before adding a city in another timezone.

### Time

- Store instants as UTC ISO strings (`starts_at`). Store plain dates as `YYYY-MM-DD`.
- Convert with `krakowToUtc`, `toKrakowWallClock`, `todayInKrakow` and `nextWeekday` from
  `@/shared/lib`. They use `Europe/Warsaw` and follow daylight saving. Never use the server's local
  time. The zone is fixed for now (see Cities).
- The finder's `Today / Tomorrow / Sat / Sun` is a display of a real date, not data. Only games in
  the next 7 days with one of those names appear in the finder. The calendar shows every date.

### Client data

- One key factory per entity, built with `queryOptions` so cache reads are typed:
  `entities/player/api/playerQueries.ts`, `openGameQueries.ts`, `entities/game/api/calendarQueries.ts`.
- A page that needs data for its first render prefetches it by calling the **server function
  directly** (not its own API, since cookies do not forward), under the same `queryKey`, and hands
  it over with `HydrationBoundary`. Data that does not change on the client (players, courts) goes
  in as props.
- `QueryProvider` sets `staleTime` to 30 s so handed-over data is not refetched at once.
- Mutation hooks live in the feature that owns the action (`save-player`, `join-game`,
  `offer-game`, `edit-profile`). They update or invalidate through the key factories. Saving a
  player updates the cache at once and rolls back on error. Other writes take the server's answer
  and put it in the cache. After a profile change call `router.refresh()`, because the header
  reads the profile on the server.
- Failures follow the `error-handling` skill. A select cannot show its own error, so server
  `fieldErrors` for selects are joined into the form's `FormAlert` (`messagesForFields`). The form
  keeps everything typed. A failed refresh keeps the data already loaded and offers a retry.

### Tests for backend code

- Server tests start with `// @vitest-environment node` and use the in-memory database
  (`DATABASE_PATH=:memory:` in `vitest.config.mts`). Create users with `createUser`. Pass `now`
  into functions that depend on time, so tests do not depend on the clock.
- Test the failure branch: full game, game that has started, wrong owner, unknown id, bad range.
- Pure helpers (`matching`, `schedule`, `krakowTime`) get plain unit tests.
- Client tests use `createTestQueryClient` and `renderWithQuery` from `@/shared/testing`, put data
  in the cache with `setQueryData`, and stub `fetch` with a small in-memory fake of the API.

### Realtime messaging: Socket.IO

Messaging uses Socket.IO. Route Handlers cannot hold a WebSocket open, so the design is:

- **Separate Node process.** Run the Socket.IO server as its own process (`npm run realtime`) that
  imports the same `server/` modules as the web app. It cannot run on a serverless host. Deploy it
  where long-lived connections work.
- **REST for history, sockets for live events.** Conversations, message history (cursor
  pagination), unread counts and mark-as-read are Route Handlers. The socket only delivers new
  messages, read receipts and presence.
- **Persist first, then emit.** A message is written to the database, then emitted. The sender
  gets an acknowledgement. The client sends a `clientMessageId` that is unique per conversation, so
  a resend after a dropped connection never creates a duplicate.
- **Authenticate the handshake** with the same session cookie. Look the token hash up with the
  `server/auth` code in an `io.use` middleware, and refuse the connection without a valid session.
  Check on every event that the user is a member of the conversation.
- **Validate every event payload with Zod.** Event schemas live in `entities/conversation/model`,
  next to the message and conversation schemas, so server and client share them.
- **Rooms.** One room per user (`user:<id>`), so every open tab of the recipient gets the message.
  Do not rely on one socket per user.
- **Unread** is `last_read_message_id` per conversation member. Do not keep a boolean.
- **Reconnect.** After a reconnect the client fetches what it missed from
  `GET /api/conversations/:id/messages?after=<id>`. Never rely only on the socket buffer.
- **Client.** One socket per tab, created in a provider in `app/providers`. Incoming events update
  the TanStack Query cache with `setQueryData`. They do not create a second copy of the data in
  state. A failed send keeps the text in the input and shows the error.
- **More than one instance** needs the Redis adapter (`@socket.io/redis-adapter`) so a message
  reaches a recipient connected to another instance. Presence (`online`) is then kept in Redis with
  a short TTL.
- **Conversations are unique per pair of users** (`user_a < user_b` with a `UNIQUE` constraint). Create
  one on the first message, not when a chat is opened.

### What is still sample data

Replace these with the same pattern (table, `server/` module, Route Handler, query key) when they
are built. Until then they stay clearly marked as samples and must not be mixed into real data.

- Inbox and chat (`entities/conversation`, invite courts and slots) until the Socket.IO work.
- "Next games" (`entities/game`) and the dashboard cards. They disagree with the real calendar.
- "Who's free" faces on the calendar (needs an availability model).
- Change password, delete account, notification settings.
- The level quiz result only changes the filter locally. It does not save to the profile.
- `online` is always `false`. `freeTonight` and `wantsDoublesPartner` are stored flags until
  availability exists.
- Ranking, tournaments news, court offers, payments and bookings do not exist yet.

## Next.js App Router conventions

- `src/app/` contains only Next routing files (`layout.tsx`, `page.tsx`, `loading.tsx`,
  `error.tsx`, `not-found.tsx`, `route.ts`), `providers/`, and `globals.css`. Route files are thin:
  a `page.tsx` renders one component from `views/`. The only other thing it may do is load that
  page's data on the server (session check, prefetch, `HydrationBoundary`) and pass it in.
- Server Components by default. Add `'use client'` only at the leaves that need state, effects, or
  browser APIs.
- `params` and `searchParams` are Promises. `await` them.
- Request interception lives in `src/proxy.ts`. `middleware.ts` is deprecated in Next 16.
- Fetch in Server Components when data is needed for the initial render. Use TanStack Query in
  client components for data that changes on the client. When both apply, prefetch on the server
  and hand off through `HydrationBoundary`.
- Use `next/image`, `next/link`, and `next/font`. Give images explicit `width` and `height`.

## Data: TanStack Query

- Server state lives in the Query cache. Never copy it into `useState`.
- One query key factory per entity in `entities/<name>/api/<name>Queries.ts`. Never hardcode key
  strings anywhere else.

```ts
export const playerQueries = {
  all: () => ({ queryKey: ['players'] as const }),
  list: (filters: PlayerFilters) => ({
    queryKey: ['players', 'list', filters] as const,
    queryFn: () => playerApi.list(filters),
  }),
  detail: (id: string) => ({
    queryKey: ['players', 'detail', id] as const,
    queryFn: () => playerApi.get(id),
  }),
};
```

- The `QueryClientProvider` lives in `app/providers`. Mutations invalidate through the key factory
  and handle both success and error. Never clear form input on error.

## Validation: Zod

- Forms use `useForm` with `zodResolver(schema)` and `defaultValues` from the slice's `model/`.
  Bind inputs with `FormTextField` from `@/shared/ui`; never read form values with `FormData`.
- Every external boundary is validated with Zod: form input, Route Handler and Server Action
  input, URL search params, and environment variables.
- Schemas live in the `model/` segment of the slice that owns the shape. Derive types with
  `z.infer<typeof schema>`; never write the type twice.
- Environment variables are parsed once: public `NEXT_PUBLIC_*` values in `shared/config/env.ts`,
  secrets in `server/config/env.ts`. `.env.example` lists every variable; update it when adding one.

## Styling: CSS Modules

- Every component style is a co-located `Component.module.css` imported as `styles`. No Tailwind,
  no CSS-in-JS, no global class names, no inline styles except for genuinely dynamic values.
- `app/globals.css` holds only resets and design tokens (CSS custom properties). Components
  reference tokens, never raw values.
- No hard-coded `px` values anywhere in CSS. Use `rem` and tokens (`--space-*`, `--text-*`,
  `--radius*`, `--border-width`, `--focus-ring-width`, `--shadow-*`). Add a token in rem when none
  fits.

## Accessibility: WCAG 2.2 AA

Every page and component must meet WCAG 2.2 level AA. Accessibility is part of "done", not a
follow-up.

- **Semantic HTML first, ARIA second.** Use the native element (`button`, `a`, `nav`, `main`,
  `h1`–`h6`, `label`, `ul`) before adding a `role`. Never put click handlers on `div` or `span`.
  No ARIA is better than wrong ARIA.
- **Interactive components come from `react-aria-components`**, wrapped in `shared/ui` (`Button`,
  `TextField`, `Drawer`, …). They provide keyboard support, focus management and ARIA wiring. Do not
  hand-roll dialogs, menus, tabs, comboboxes or switches; add a `shared/ui` wrapper instead.
- **Links navigate, buttons act.** Use `next/link` for navigation and `Button` for actions. Mark the
  current nav item with `aria-current="page"`.
- **Page structure.** Each page has exactly one `h1`, headings do not skip levels, and content sits
  in landmarks (`header`, `nav` with an `aria-label`, `main`, `aside`, `footer`). Every page sets a
  unique `metadata.title`. `<html lang>` stays set.
- **Keyboard.** Everything works with the keyboard alone, in a logical tab order, with no traps.
  Dialogs and drawers trap focus while open, close on Esc, and return focus to the trigger.
- **Visible focus.** Never remove an outline without a replacement. Style focus with
  `[data-focus-visible]` (React Aria) or `:focus-visible`, using at least 2px and 3:1 contrast.
- **Names for everything.** Every control has an accessible name: visible text, a `<Label>`, or
  `aria-label` for icon-only buttons. Decorative SVGs get `aria-hidden="true"`. Images get
  meaningful `alt`, or `alt=""` when decorative.
- **Forms.** Every input has a visible label (placeholders are not labels). Errors appear as text
  next to the field and are linked to it (`FormTextField` does this through React Aria), never by
  color alone. Set the right `type` and `autoComplete`. Form-level messages use `role="alert"`.
- **Contrast.** Text is at least 4.5:1 (3:1 for large text), and UI component borders and icons at
  least 3:1, in **both** light and dark themes. Check new token pairs in `globals.css` before use.
- **Target size.** Pointer targets are at least 24×24 CSS px; aim for 44×44 on primary actions.
- **Motion.** Respect `prefers-reduced-motion: reduce` by disabling non-essential animation.
- **Resize and reflow.** Layouts work at 320px wide and at 200% zoom without horizontal scrolling or
  lost content. Size text in `rem`, never fixed `px` heights on text containers.
- **Dynamic content.** Announce async results and status changes with a live region
  (`role="status"` or `role="alert"`). Loading states are perceivable, not just a spinner.
- **Visually hidden text** uses `VisuallyHidden` from `@/shared/ui` (the clip-path technique), never
  `display: none`, which hides it from screen readers too. Responsive hiding inside a media query
  repeats the same clip-path declarations.
- **Colors** come from the contrast-checked tokens: `--border-strong` for control boundaries,
  `--danger` for errors, `--focus-ring` for focus. Never use raw palette values for these.
- **Testing.** Query elements in tests by role and accessible name (`getByRole('button',
{ name: 'Sign in' })`), which doubles as an accessibility check. Before merging UI changes, tab
  through the page and check it with a screen reader (VoiceOver on macOS).

## Naming

A component's folder is kebab-case even when the file inside is PascalCase:
`shared/ui/text-field/TextField.tsx`.

| Thing                       | Convention                  | Example                                           |
| --------------------------- | --------------------------- | ------------------------------------------------- |
| Folders, slices, segments   | kebab-case, always          | `features/create-match/`, `shared/ui/text-field/` |
| Components (incl. drawers)  | PascalCase file and export  | `MatchCard.tsx`, `FiltersDrawer.tsx`              |
| Component styles            | same name plus `.module`    | `MatchCard.module.css`                            |
| Hooks                       | camelCase with `use` prefix | `useMatchFilters.ts`                              |
| Utilities and other modules | camelCase                   | `jobUtils.ts`, `date.ts`, `matchQueries.ts`       |
| Tests                       | same name plus `.test`      | `MatchCard.test.tsx`, `date.test.ts`              |
| Next routing files          | Next's lowercase names      | `page.tsx`, `layout.tsx`, `route.ts`              |
| Environment variables       | SCREAMING_SNAKE_CASE        | `DATABASE_URL`                                    |

## Testing

- Vitest with Testing Library. Tests sit next to the code they cover (`date.ts` → `date.test.ts`).
- Shared test infrastructure (render helpers, MSW handlers, setup) lives in `shared/testing/` and
  is imported from there, not from deep paths.
- Test behavior through a slice's public API, not its implementation details.
- Group tests with `describe` blocks by section or behavior. Name each test as a plain-English
  sentence that says what it checks: `it('shows an error when the passwords do not match')`.
- Query the UI the way a user would: by role and accessible name, label, or visible text
  (`getByRole`, `getByLabelText`, `getByText`). Use `data-testid` only when nothing else works.

## Code style

- Prettier is the single source of formatting truth (`.prettierrc`: single quotes, 100 columns,
  trailing commas, semicolons). Do not hand-format.
- Import React types by name with `import type`: `import type { ReactNode } from 'react';`,
  then `children: ReactNode`. Never use the `React.` namespace (`React.ReactNode`, `React.FC`).
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`,
  `test:`).

### TypeScript

- Strict mode. Type function inputs and outputs explicitly, including return types.
- No escape hatches in production code: no `as` type assertions, no `any`, no `unknown`, and no
  non-null `!`. To narrow, use a type guard, a discriminated union, `satisfies`, Zod parsing, or
  handle the `undefined` case. Import renames (`import { X as Y }`) are not assertions.
- Prefer readonly types for data that should not be mutated: `readonly string[]`,
  `ReadonlyArray<T>`, `ReadonlyMap<K, V>`, `ReadonlySet<T>`, `Readonly<T>`.
- Use branded types for values with a specific format (an ISO date string, a player id) so they
  cannot be mixed up with plain strings. Create them by parsing, not by asserting:
  `const isoDateSchema = z.iso.date().brand<'IsoDate'>(); type IsoDate = z.infer<typeof isoDateSchema>;`
- Use `as const` for lookup tables so their keys and values are typed literally, and pair it with
  `satisfies` to check the shape: `const labels = { ... } as const satisfies Record<Surface, string>;`

### Functions

- Write small, pure functions that do one thing and return a value. Never mutate inputs; return a
  new value instead.
- Return early on invalid input so the main path stays unindented.
- Map keys to values with a lookup table (`Record<Key, Value>`), not an `if`/`else` chain or
  `switch`.
- Prefer readable, named steps over clever one-liners. Derive state instead of storing it.

### Comments

- Default to no comment. Name things well so the code explains itself.
- Write a comment only when the _why_ is not visible in the code: a hidden constraint,
  a deliberate deviation (for example a contrast fix), or a workaround for a bug.
- Never describe what the code does, and never reference a design file, ticket or
  conversation ("per Figma", "as requested"). Those go stale; put the number in a
  token or in the commit message instead.
- Match the surrounding code: if neighbouring files have no comments, add none.
- Keep a comment to one line. Delete it when the reason is gone.
