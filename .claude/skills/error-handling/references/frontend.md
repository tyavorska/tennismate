# Frontend error handling

Stack: TanStack Query, React Hook Form + Zod, `react-aria-components`, Next.js App Router. All
code follows `CLAUDE.md`: explicit types, no `as` / `any` / `unknown` / `!`, readonly data, lookup
tables, CSS Modules, WCAG 2.2 AA.

## 1. The error model: `shared/api/errors.ts`

One discriminated union. Components never inspect status codes; they read `kind`.

```ts
export type ErrorKind =
  | 'network'
  | 'unavailable'
  | 'server'
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'rateLimited'
  | 'malformed'
  | 'unexpected';

export type FieldErrors = Readonly<Record<string, string>>;

export class ApiError extends Error {
  readonly kind: ErrorKind;
  readonly status: number | null;
  readonly requestId: string | null;
  readonly fieldErrors: FieldErrors;
  readonly retryAfterMs: number | null;

  constructor(init: {
    kind: ErrorKind;
    status?: number | null;
    requestId?: string | null;
    fieldErrors?: FieldErrors;
    retryAfterMs?: number | null;
  }) {
    super(init.kind);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status ?? null;
    this.requestId = init.requestId ?? null;
    this.fieldErrors = init.fieldErrors ?? {};
    this.retryAfterMs = init.retryAfterMs ?? null;
  }
}

const kindByStatus = {
  400: 'validation',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'notFound',
  409: 'conflict',
  422: 'validation',
  429: 'rateLimited',
  500: 'server',
  502: 'unavailable',
  503: 'unavailable',
  504: 'unavailable',
} as const satisfies Readonly<Record<number, ErrorKind>>;

function isKnownStatus(status: number): status is keyof typeof kindByStatus {
  return status in kindByStatus;
}

export function kindFromStatus(status: number): ErrorKind {
  if (isKnownStatus(status)) return kindByStatus[status];
  return status >= 500 ? 'server' : 'unexpected';
}

/** Turns anything thrown into an ApiError, so callers handle exactly one shape. */
export function toApiError(error: Error | ApiError): ApiError {
  if (error instanceof ApiError) return error;
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return new ApiError({ kind: 'network' });
  }
  if (error instanceof TypeError) return new ApiError({ kind: 'network' });
  return new ApiError({ kind: 'unexpected' });
}
```

TanStack Query types errors as `Error`; register `ApiError` so `error.kind` is typed everywhere:

```ts
// shared/api/queryTypes.ts
import type { ApiError } from './errors';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
```

## 2. The policy table: `shared/api/errorPolicy.ts`

Every message, retry decision, log level and next action comes from here. Same kind, same text.

```ts
import type { ErrorKind } from './errors';

type LogLevel = 'info' | 'warn' | 'error';
type NextAction =
  'retry' | 'retryLater' | 'fixFields' | 'signIn' | 'requestAccess' | 'goBack' | 'reload' | 'wait';

type ErrorPolicy = Readonly<{
  retryable: boolean;
  logLevel: LogLevel;
  title: string;
  message: string;
  action: NextAction;
  actionLabel: string;
  showReference: boolean;
}>;

export const errorPolicy = {
  network: {
    retryable: true,
    logLevel: 'warn',
    title: 'Connection problem',
    message: "We couldn't reach the server. Your changes are still here.",
    action: 'retry',
    actionLabel: 'Try again',
    showReference: false,
  },
  unavailable: {
    retryable: true,
    logLevel: 'warn',
    title: 'Service unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few minutes.',
    action: 'retryLater',
    actionLabel: 'Try again',
    showReference: false,
  },
  server: {
    retryable: false,
    logLevel: 'error',
    title: 'Something went wrong',
    message: 'Something went wrong on our side. Please try again.',
    action: 'retry',
    actionLabel: 'Try again',
    showReference: true,
  },
  validation: {
    retryable: false,
    logLevel: 'info',
    title: 'Check your details',
    message: 'Some fields need attention.',
    action: 'fixFields',
    actionLabel: 'Review fields',
    showReference: false,
  },
  unauthenticated: {
    retryable: false,
    logLevel: 'info',
    title: 'Session expired',
    message: 'Your session has expired. Sign in again to continue.',
    action: 'signIn',
    actionLabel: 'Sign in',
    showReference: false,
  },
  forbidden: {
    retryable: false,
    logLevel: 'info',
    title: 'No access',
    message: "You don't have permission to do this.",
    action: 'requestAccess',
    actionLabel: 'Request access',
    showReference: false,
  },
  notFound: {
    retryable: false,
    logLevel: 'info',
    title: 'Not found',
    message: 'This item no longer exists.',
    action: 'goBack',
    actionLabel: 'Back to the list',
    showReference: false,
  },
  conflict: {
    retryable: false,
    logLevel: 'info',
    title: 'Changed by someone else',
    message: 'This item was changed by someone else. Your edits are kept.',
    action: 'reload',
    actionLabel: 'Reload and review',
    showReference: false,
  },
  rateLimited: {
    retryable: true,
    logLevel: 'warn',
    title: 'Slow down',
    message: 'Too many requests. Trying again shortly.',
    action: 'wait',
    actionLabel: 'Try again',
    showReference: false,
  },
  malformed: {
    retryable: false,
    logLevel: 'error',
    title: 'Unexpected data',
    message: 'We received unexpected data. Your current data is unchanged.',
    action: 'retry',
    actionLabel: 'Try again',
    showReference: true,
  },
  unexpected: {
    retryable: false,
    logLevel: 'error',
    title: 'Something went wrong',
    message: 'Something went wrong.',
    action: 'retry',
    actionLabel: 'Try again',
    showReference: true,
  },
} as const satisfies Readonly<Record<ErrorKind, ErrorPolicy>>;
```

## 3. The HTTP client: `shared/api/apiFetch.ts`

The only place that calls `fetch`. It adds a timeout, classifies failures, reads the server's
problem body, and parses success bodies with the caller's Zod schema so bad data never reaches the
cache.

```ts
import { z } from 'zod';
import { ApiError, kindFromStatus } from './errors';

const TIMEOUT_MS = 15_000;

const problemSchema = z.object({
  code: z.string(),
  requestId: z.string().optional(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

function retryAfterMs(response: Response): number | null {
  const header = response.headers.get('Retry-After');
  if (header === null) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function errorFromResponse(response: Response): Promise<ApiError> {
  const body = problemSchema.safeParse(await response.json().catch(() => null));
  return new ApiError({
    kind: kindFromStatus(response.status),
    status: response.status,
    requestId: body.success ? (body.data.requestId ?? null) : response.headers.get('X-Request-Id'),
    fieldErrors: body.success ? (body.data.fieldErrors ?? {}) : {},
    retryAfterMs: retryAfterMs(response),
  });
}

export async function apiFetch<TSchema extends z.ZodType>(
  url: string,
  schema: TSchema,
  init: RequestInit = {},
): Promise<z.infer<TSchema>> {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => {
    // fetch rejects only for no connection, CORS or the timeout above: all are 'network'.
    throw new ApiError({ kind: 'network' });
  });

  if (!response.ok) throw await errorFromResponse(response);

  const parsed = schema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError({
      kind: 'malformed',
      status: response.status,
      requestId: response.headers.get('X-Request-Id'),
    });
  }
  return parsed.data;
}
```

Entity APIs (`entities/<name>/api/<name>Api.ts`) call `apiFetch` with the entity's Zod schema.

## 4. Global handlers: `app/providers/QueryProvider.tsx`

Retries, logging and session expiry are handled once for every query and mutation.

```ts
const MAX_ATTEMPTS = 3;

function shouldRetry(failureCount: number, error: ApiError): boolean {
  return errorPolicy[error.kind].retryable && failureCount < MAX_ATTEMPTS - 1;
}

function retryDelay(attempt: number, error: ApiError): number {
  return error.retryAfterMs ?? 1000 * 2 ** attempt; // 1s, 2s, 4s
}

function createQueryClient(onError: (error: ApiError, operation: string) => void): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onError(error, String(query.queryKey[0])),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        onError(error, mutation.options.mutationKey?.join('.') ?? 'mutation'),
    }),
    defaultOptions: {
      queries: { retry: shouldRetry, retryDelay },
      // Writes retry only when they carry an Idempotency-Key; opt in per mutation.
      mutations: { retry: false },
    },
  });
}
```

The `onError` passed in logs with `logError` (kind, operation, status, request ID) and, for
`unauthenticated`, saves any registered draft and calls
`router.replace('/sign-in?returnTo=' + encodeURIComponent(pathname))`. Every mutation sets a
`mutationKey` so logs name the operation.

## 5. Per-operation handling

### Save / submit (form)

```tsx
const form = useForm<MatchInput>({ resolver: zodResolver(matchSchema), defaultValues });
const [idempotencyKey] = useState(() => crypto.randomUUID());
const save = useMutation({
  mutationKey: ['matches', 'create'],
  mutationFn: (input: MatchInput) => matchApi.create(input, idempotencyKey),
  retry: (count, error) => shouldRetry(count, error), // safe: protected by the key
  onSuccess: () => queryClient.invalidateQueries(matchQueries.all()),
  onError: (error) => {
    if (error.kind !== 'validation') return; // FormAlert renders the rest from save.error
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (isMatchField(field)) form.setError(field, { message }, { shouldFocus: true });
    }
  },
});

<Form onSubmit={form.handleSubmit((values) => save.mutate(values))} validationBehavior="aria">
  {/* FormTextField fields: keep their values on failure, never reset here */}
  {save.isError && <FormAlert error={save.error} onRetry={() => save.mutate(form.getValues())} />}
  <Button type="submit" isPending={save.isPending}>
    Save match
  </Button>
</Form>;
```

- `isPending` disables the button and announces progress; repeat clicks are ignored.
- `form.reset()` only inside `onSuccess`, never on error.
- `FormAlert` states the save outcome: "Not saved." plus the policy message.

### Load (no data yet) vs refresh (data on screen)

```tsx
const { data, error, isPending, isError, isRefetchError, refetch } = useQuery(
  playerQueries.list(filters),
);

if (isPending) return <LoadingState label="Loading players" />;
if (isError && data === undefined) return <ErrorState error={error} onRetry={refetch} />;

return (
  <>
    {isRefetchError && <Banner error={error} onRetry={refetch} />}
    <PlayerList players={data} />
  </>
);
```

TanStack Query keeps the previous `data` when a refetch fails, so the old list stays. Use
`placeholderData: keepPreviousData` when filters change so the view swaps only on success.

### Permission

Hide or disable actions using the user's permissions, and still map a 403 to `AccessDenied`. For
page-level checks in a Server Component, render `<AccessDenied />` (or call `forbidden()` when the
`authInterrupts` option is enabled), never a broken page.

### Not found

In Server Components call `notFound()` from `next/navigation`; each route that loads an item has a
`not-found.tsx` with a link back to the list. In client components render `ErrorState` with the
`notFound` policy.

### Conflict

Open `ConflictDialog`, keep the draft in form state, refetch the latest item, and let the user
review before saving again with the new version.

### Export / download

```ts
async function exportMatches(filters: MatchFilters): Promise<void> {
  const blob = await matchApi.export(filters); // whole file, or throws: nothing downloaded
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: 'matches.csv' });
  link.click();
  URL.revokeObjectURL(url);
}
```

Run it through `useMutation`; `onError` shows a `Toast` with Retry. The page is not changed.

### Render crashes

Every route segment that fetches data has an `error.tsx`:

```tsx
'use client';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState error={toApiError(error)} reference={error.digest} onRetry={retry} />;
}
```

`app/global-error.tsx` covers the root layout. It renders its own `<html>` and `<body>` and does not
get global styles or the theme attribute, so it applies them itself.

## 6. Components in `shared/ui`

All are built on `react-aria-components` and styled with CSS Modules tokens. Each takes an
`ApiError` and reads its text from `errorPolicy[error.kind]`.

| Component        | Role / ARIA                                          | Contents                                                    |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `FieldError`     | Part of `TextField` (`aria-describedby`)             | Per-field message from `fieldErrors` or the Zod schema      |
| `FormAlert`      | `role="alert"`                                       | Outcome ("Not saved."), message, Retry button, reference ID |
| `ErrorState`     | Region with a heading                                | Title, message, primary action, reference ID when enabled   |
| `Banner`         | `role="status"`                                      | Short message, Retry, dismiss; content below stays usable   |
| `Toast`          | RAC `UNSTABLE_Toast` region, `role="status"`/`alert` | Message and action; errors do not auto-dismiss              |
| `AccessDenied`   | Region with a heading                                | Explanation, "Request access" or contact admin              |
| `ConflictDialog` | RAC `Dialog` (`alertdialog`)                         | What changed, "Reload and review", keeps the draft          |
| `LoadingState`   | `role="status"` with a text label                    | Spinner plus visible or visually hidden text                |

Reference IDs are shown as "Reference: abc123" in muted text so support can find the log line.
