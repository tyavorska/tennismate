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
| Tests               | Vitest + Testing Library, co-located with the code under test           |
| Lint / format       | ESLint (`eslint-config-next` + `eslint-config-prettier`), Prettier      |
| Runtime             | Node 24 LTS (see `.nvmrc`), npm                                         |

TanStack Query, Zod, and Vitest are the chosen libraries but are not installed yet. Add them the
first time they are needed (`@tanstack/react-query`, `zod`, `vitest` with `@testing-library/react`
and `jsdom`). Do not substitute alternatives.

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # next typegen, then tsc --noEmit
npm run format       # Prettier, writes changes
npm run format:check # Prettier, read-only (CI)
```

`lint`, `typecheck`, and `format:check` must all pass before a commit.

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

## Next.js App Router conventions

- `src/app/` contains only Next routing files (`layout.tsx`, `page.tsx`, `loading.tsx`,
  `error.tsx`, `not-found.tsx`, `route.ts`), `providers/`, and `globals.css`. Route files are thin:
  a `page.tsx` renders one component from `views/` and nothing else.
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

| Thing                     | Convention                  | Example                                     |
| ------------------------- | --------------------------- | ------------------------------------------- |
| Folders, slices, segments | kebab-case                  | `features/create-match/`, `shared/ui/`      |
| Components                | PascalCase file and export  | `MatchCard.tsx`, `MatchCard.module.css`     |
| Hooks                     | camelCase with `use` prefix | `useMatchFilters.ts`                        |
| Other modules             | camelCase                   | `matchQueries.ts`, `formatScore.ts`         |
| Tests                     | same name plus `.test`      | `MatchCard.test.tsx`, `formatScore.test.ts` |
| Next routing files        | Next's lowercase names      | `page.tsx`, `layout.tsx`, `route.ts`        |
| Environment variables     | SCREAMING_SNAKE_CASE        | `DATABASE_URL`                              |

## Testing

- Vitest with Testing Library. Tests are co-located with the code they cover.
- Shared test infrastructure (render helpers, MSW handlers, setup) lives in `shared/testing/` and
  is imported from there, not from deep paths.
- Test behavior through a slice's public API, not its implementation details.

## Code style

- Prettier is the single source of formatting truth (`.prettierrc`: single quotes, 100 columns,
  trailing commas, semicolons). Do not hand-format.
- TypeScript strict. No `any` without a comment explaining why. Prefer discriminated unions for
  state machines and `satisfies` over type assertions.
- Import React types by name with `import type`: `import type { ReactNode } from 'react';`,
  then `children: ReactNode`. Never use the `React.` namespace (`React.ReactNode`, `React.FC`).
- Prefer readable, named steps over clever one-liners. Derive state instead of storing it.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`,
  `test:`).
