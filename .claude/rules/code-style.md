---
paths:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
  - 'scripts/**'
---

# Code style

## TypeScript

- Type function inputs and outputs explicitly, including return types.
- Narrow with a type guard, a discriminated union, `satisfies`, Zod parsing, or an explicit
  `undefined` branch. Escape hatches (`as` assertions, `any`, `unknown`, non-null `!`) stay out of
  production code; import renames (`import { X as Y }`) are fine.
- Import React types by name: `import type { ReactNode } from 'react';`, then
  `children: ReactNode`. No `React.` namespace.
- Use readonly types for data that is not mutated: `readonly string[]`, `ReadonlyMap<K, V>`,
  `Readonly<T>`.
- Brand values with a specific format (an ISO date, a player id) by parsing, so they cannot mix
  with plain strings:
  `const isoDateSchema = z.iso.date().brand<'IsoDate'>(); type IsoDate = z.infer<typeof isoDateSchema>;`
- Write lookup tables as `as const` plus `satisfies`:
  `const labels = { ... } as const satisfies Record<Surface, string>;`

## Validation

- Schemas live in the `model/` segment of the slice that owns the shape. Derive types with
  `z.infer<typeof schema>`, so each shape is written once.
- Parse environment variables once: public `NEXT_PUBLIC_*` in `shared/config/env.ts`, secrets in
  `server/config/env.ts`. Add each new variable to `.env.example`.

## Functions

- Small, pure, one job, returns a value. Return a new value instead of mutating input.
- Return early on invalid input so the main path stays unindented.
- Map keys to values with a `Record<Key, Value>` lookup, not `if`/`else` or `switch`.
- Derive state instead of storing it.

## Comments

Comment the _why_ only: a hidden constraint, a deliberate deviation (a contrast fix), or a bug
workaround. One line, deleted when the reason is gone. Put design references and ticket numbers in
a token or the commit message. If neighbouring files carry no comments, add none.
