---
paths:
  - 'src/app/**'
  - 'src/views/**'
  - 'src/widgets/**'
  - 'src/features/**'
  - 'src/entities/**'
  - 'src/shared/**'
---

# Frontend

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
- The city shown in the UI comes from the profile (`viewer.city`). Do not hard-code a city name.

## Data: TanStack Query

- Server state lives in the Query cache. Never copy it into `useState`.
- One key factory per entity in `entities/<name>/api/<name>Queries.ts`, built with `queryOptions`
  so cache reads are typed (`playerQueries.ts`, `openGameQueries.ts`, `calendarQueries.ts`). Never
  hardcode key strings anywhere else.

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

- A page that needs data for its first render prefetches it by calling the **server function
  directly** (not its own API, since cookies do not forward), under the same `queryKey`, and hands
  it over with `HydrationBoundary`. Data that does not change on the client (players, courts) goes
  in as props.
- The `QueryClientProvider` lives in `app/providers`. `QueryProvider` sets `staleTime` to 30 s so
  handed-over data is not refetched at once.
- Mutation hooks live in the feature that owns the action (`save-player`, `join-game`,
  `offer-game`, `edit-profile`). They update or invalidate through the key factories and handle
  both success and error. Saving a player updates the cache at once and rolls back on error. Other
  writes take the server's answer and put it in the cache. After a profile change call
  `router.refresh()`, because the header reads the profile on the server.
- Failures follow the `error-handling` skill. A select cannot show its own error, so server
  `fieldErrors` for selects are joined into the form's `FormAlert` (`messagesForFields`). The form
  keeps everything typed. A failed refresh keeps the data already loaded and offers a retry.

## Forms

- Forms use `useForm` with `zodResolver(schema)` and `defaultValues` from the slice's `model/`.
  Bind inputs with `FormTextField` from `@/shared/ui`; never read form values with `FormData`.
- Never clear form input on error.
