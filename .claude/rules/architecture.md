---
paths:
  - 'src/**'
---

# Feature-Sliced Design

## Layers

```
src/
├── app/        Next.js App Router: routing files, root layout, providers, global styles
├── views/      Route-level page compositions (FSD "pages"; renamed because Next reserves pages/)
├── widgets/    Self-contained UI blocks composed from features and entities (header, match list)
├── features/   User interactions and business actions (create-match, filter-players)
├── entities/   Business objects: types, schemas, queries, base UI (player, match, court)
├── shared/     Reusable code with no business knowledge (ui kit, api client, lib, config)
└── server/     Backend-only code: database, external services, auth
```

## Import rules

- **Imports flow downward only**: `app → views → widgets → features → entities → shared`. A layer
  may import from any layer below it, never from a layer above.
- **No imports across slices on the same layer.** `features/create-match` must not import
  `features/filter-players`. Move the shared code down to `entities/` or `shared/`.
- **Import through the public API.** Every slice exposes an `index.ts`. Import `@/entities/player`,
  never `@/entities/player/api/playerQueries`.
- **`app/` and `shared/` have no slices.** `app/` holds only routing and global setup. `shared/` is
  flat (`ui/`, `api/`, `lib/`, `config/`, `hooks/`, `testing/`) and knows nothing about the domain.
- Use the `@/` alias (maps to `src/`). No deep relative paths across layers.

## Slice layout and segments

```
features/create-match/
├── ui/       CreateMatchForm.tsx, CreateMatchForm.module.css
├── model/    createMatchSchema.ts (Zod), useCreateMatch.ts — business rules live here
├── api/      createMatchApi.ts (HTTP calls, query and mutation definitions)
├── lib/      helpers specific to this slice
└── index.ts  public API
```

Business rules belong in `model/` (or `entities/*/model`), never inside JSX or an API client.
