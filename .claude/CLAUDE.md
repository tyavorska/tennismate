@AGENTS.md

# LET

Let is a Next.js web app for tennis players to find playing partners and organize matches.
This file holds the rules for every change. Area rules live in `.claude/rules/` and load only when
matching files are touched. Rare workflows live in `.claude/skills/`. Plans and sample-data notes
live in `docs/roadmap.md`.

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
| Realtime messaging  | Socket.IO in a separate Node process (`npm run realtime`)               |
| Tests               | Vitest + Testing Library, co-located with the code under test           |
| Lint / format       | ESLint (`eslint-config-next` + `eslint-config-prettier`), Prettier      |
| Runtime             | Node 24 LTS (see `.nvmrc`), npm                                         |

`socket.io` and `socket.io-client` carry messaging and online status (see the `realtime-messaging`
skill). Run `npm run dev` and `npm run realtime` together. Do not substitute alternatives (no `ws`,
SSE or polling for chat).

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run realtime     # Socket.IO server on http://localhost:4000 (chat, online status)
npm run build        # production build
npm run lint         # ESLint and Stylelint
npm run typecheck    # next typegen, then tsc --noEmit
npm test             # Vitest, one run
npm run format       # Prettier, writes changes
npm run format:check # Prettier, read-only (CI)
```

`lint`, `typecheck`, `format:check`, and `test` must all pass before a commit. After adding or
renaming a Route Handler, run `typecheck` once so `RouteContext` types are regenerated.

## Rules that always apply

- **City isolation is enforced on the server, in SQL.** Every query for players, games, courts,
  districts, saved players, calendar events and tournaments filters by the viewer's `city_id`. A
  row from another city answers `notFound`.
- **No hard-coded city or time zone.** The city comes from the profile (`viewer.city`); times use
  `viewer.city.timezone`.
- **Never return another player's email or coordinates.** Only the distance is returned.
- **`server/` is never imported by client code.**
- **The schema changes only through migrations.** Never edit a merged migration.
- Every external boundary is validated with Zod. Failures follow the `error-handling` skill.

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

Imports flow downward only, never across slices on one layer, and always through a slice's
`index.ts`. Full rules and slice layout: `.claude/rules/architecture.md`; `server/` boundaries:
`.claude/rules/backend.md`.

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

### Validation

- Schemas live in the `model/` segment of the slice that owns the shape. Derive types with
  `z.infer<typeof schema>`; never write the type twice.
- Environment variables are parsed once: public `NEXT_PUBLIC_*` values in `shared/config/env.ts`,
  secrets in `server/config/env.ts`. `.env.example` lists every variable; update it when adding one.

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
