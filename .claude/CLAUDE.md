# LET

Let is a Next.js web app for tennis players to find playing partners and organize matches.
Area rules live in `.claude/rules/` and load when matching files are touched. Rare workflows live
in `.claude/skills/`. Plans and sample-data notes live in `docs/roadmap.md`.

## Stack decisions

- CSS Modules only. TanStack Query for client server-state, React Hook Form with `zodResolver`
  for forms, Zod at every boundary.
- REST through Next Route Handlers (`app/api/**/route.ts`).
- SQLite (`node:sqlite`) now; PostgreSQL when a second instance is needed.
- Chat and online status run on Socket.IO in a separate process (`npm run realtime`, started
  beside `npm run dev`); see the `realtime-messaging` skill.

## Before a commit

`lint`, `typecheck`, `format:check`, and `test` all pass. After adding or renaming a Route
Handler, run `typecheck` once so `RouteContext` types are regenerated. Commit messages follow
Conventional Commits.

## Rules that always apply

- **City isolation is enforced on the server, in SQL.** Every query for players, games, courts,
  districts, saved players, calendar events and tournaments filters by the viewer's `city_id`. A
  row from another city answers `notFound`.
- **The city and time zone come from the profile** (`viewer.city`, `viewer.city.timezone`).
- **Only the distance to another player is returned**, never their email or coordinates.
- **`server/` is never imported by client code.**
- **The schema changes only through migrations.** A merged migration stays as it is.
- Every external boundary is validated with Zod. Failures follow the "Errors" rules in `backend.md`
  and `frontend.md`.

## Architecture

`src/` follows Feature-Sliced Design: `app → views → widgets → features → entities → shared`,
plus backend-only `server/`. Layers, slice layout and import rules: `.claude/rules/architecture.md`;
`server/` boundaries: `.claude/rules/backend.md`.

## Naming

Folders, slices and segments are kebab-case, including a component's folder
(`shared/ui/text-field/TextField.tsx`).

| Thing                       | Convention                  | Example                              |
| --------------------------- | --------------------------- | ------------------------------------ |
| Components (incl. drawers)  | PascalCase file and export  | `MatchCard.tsx`                      |
| Component styles, tests     | component name plus suffix  | `MatchCard.module.css`, `.test.tsx`  |
| Hooks                       | camelCase with `use` prefix | `useMatchFilters.ts`                 |
| Utilities and other modules | camelCase                   | `date.ts`, `matchQueries.ts`         |
| Next routing files          | Next's lowercase names      | `page.tsx`, `layout.tsx`, `route.ts` |
| Environment variables       | SCREAMING_SNAKE_CASE        | `DATABASE_URL`                       |

TypeScript, validation, function and comment style: `.claude/rules/code-style.md`.
