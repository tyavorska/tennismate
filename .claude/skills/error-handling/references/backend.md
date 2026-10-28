# Backend error handling

Applies to Route Handlers (`app/**/route.ts`), Server Actions (`'use server'`), Server Components
that load data, and everything in `server/`. Every `server/` module starts with
`import 'server-only'`.

## 1. One response shape for every error

Every non-2xx response uses the same JSON body, based on RFC 9457 (Problem Details), with
`Content-Type: application/problem+json`. The client's `apiFetch` parses exactly this.

```ts
// entities or shared model: shared by server and client
export const problemSchema = z.object({
  type: z.string(), // stable URI-like id, e.g. 'https://tennismate.app/errors/validation'
  title: z.string(), // short, plain-language summary; never internal names
  status: z.number().int(),
  code: z.string(), // ErrorKind, e.g. 'validation'
  requestId: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(), // validation only
  retryAfterSeconds: z.number().int().optional(), // 429 / 503 only
});
export type Problem = z.infer<typeof problemSchema>;
```

Never put stack traces, SQL, file paths, library messages or user data in the body.

## 2. Status codes

| Situation                                                | Status | `code`            | Headers / extras                               |
| -------------------------------------------------------- | ------ | ----------------- | ---------------------------------------------- |
| Body or params fail the Zod schema                       | 422    | `validation`      | `fieldErrors` keyed by field name              |
| Request is unreadable (bad JSON)                         | 400    | `validation`      |                                                |
| No session, or session expired                           | 401    | `unauthenticated` |                                                |
| Signed in but not allowed                                | 403    | `forbidden`       |                                                |
| Item does not exist (or the user may not know it exists) | 404    | `notFound`        | Prefer 404 over 403 to avoid leaking existence |
| Version mismatch / unique constraint                     | 409    | `conflict`        | Current version in the body if useful          |
| Too many requests                                        | 429    | `rateLimited`     | `Retry-After` (seconds)                        |
| Dependency down, maintenance                             | 503    | `unavailable`     | `Retry-After` when known                       |
| Dependency timed out                                     | 504    | `unavailable`     |                                                |
| Anything unexpected                                      | 500    | `server`          | Generic title only                             |

Expected failures (`validation`, `unauthenticated`, `forbidden`, `notFound`, `conflict`) are normal
responses, not exceptions to log as errors.

## 3. Domain errors: `server/http/errors.ts`

Business code throws typed errors; it never builds HTTP responses itself.

```ts
import 'server-only';
import type { ErrorKind } from '@/shared/api';

export class DomainError extends Error {
  readonly kind: ErrorKind;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly retryAfterSeconds: number | null;

  constructor(
    kind: ErrorKind,
    options: {
      fieldErrors?: Readonly<Record<string, string>>;
      retryAfterSeconds?: number;
      cause?: Error;
    } = {},
  ) {
    super(kind, { cause: options.cause });
    this.name = 'DomainError';
    this.kind = kind;
    this.fieldErrors = options.fieldErrors ?? {};
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}
```

## 4. Mapping to a response: `server/http/problem.ts`

```ts
import 'server-only';

const statusByKind = {
  validation: 422,
  unauthenticated: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  rateLimited: 429,
  unavailable: 503,
  network: 503,
  server: 500,
  malformed: 500,
  unexpected: 500,
} as const satisfies Readonly<Record<ErrorKind, number>>;

export function toProblem(error: Error, requestId: string, operation: string): Response {
  const kind = error instanceof DomainError ? error.kind : 'server';
  const status = statusByKind[kind];
  logServerError({ kind, operation, status, requestId, error });

  const body: Problem = {
    type: `https://tennismate.app/errors/${kind}`,
    title: errorPolicy[kind].message,
    status,
    code: kind,
    requestId,
    ...(error instanceof DomainError && kind === 'validation'
      ? { fieldErrors: error.fieldErrors }
      : {}),
  };
  const headers = new Headers({
    'Content-Type': 'application/problem+json',
    'X-Request-Id': requestId,
  });
  if (error instanceof DomainError && error.retryAfterSeconds !== null) {
    headers.set('Retry-After', String(error.retryAfterSeconds));
  }
  return Response.json(body, { status, headers });
}
```

## 5. Route Handler template

```ts
// app/api/matches/route.ts
import { createMatch } from '@/server/matches';
import { toProblem, requestIdFrom, DomainError } from '@/server/http';
import { createMatchSchema } from '@/entities/match';

export async function POST(request: Request): Promise<Response> {
  const requestId = requestIdFrom(request);
  try {
    const session = await requireSession(); // throws DomainError('unauthenticated')
    const json = await request.json().catch(() => {
      throw new DomainError('validation');
    });
    const input = createMatchSchema.safeParse(json);
    if (!input.success) {
      throw new DomainError('validation', { fieldErrors: fieldErrorsFrom(input.error) });
    }
    const idempotencyKey = request.headers.get('Idempotency-Key');
    const match = await createMatch(session, input.data, idempotencyKey);
    return Response.json(match, { status: 201, headers: { 'X-Request-Id': requestId } });
  } catch (error) {
    return toProblem(
      error instanceof Error ? error : new Error('Non-error thrown'),
      requestId,
      'matches.create',
    );
  }
}
```

Order inside every handler: **request ID → auth → parse → validate → authorize → do work →
respond**. Validate before touching the database.

## 6. Server Actions

Server Actions return a result union for expected failures instead of throwing, so the form can
show field errors without an error boundary. Throw only for unexpected failures, which reach
`error.tsx`.

```ts
'use server';

type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      kind: ErrorKind;
      fieldErrors?: Readonly<Record<string, string>>;
      requestId: string;
    };

export async function updateProfile(input: ProfileInput): Promise<ActionResult<Profile>> {
  const requestId = crypto.randomUUID();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, kind: 'validation', fieldErrors: fieldErrorsFrom(parsed.error), requestId };
  }
  const session = await getSession();
  if (session === null) return { ok: false, kind: 'unauthenticated', requestId };
  // ...
}
```

Server Actions are public HTTP endpoints: always re-check auth and permissions inside them.

## 7. Request IDs

`src/proxy.ts` sets `X-Request-Id` on every request (reuse an incoming one, otherwise
`crypto.randomUUID()`). Handlers read it with `requestIdFrom(request)`, put it in every log line and
every problem body, and return it in the `X-Request-Id` header. The UI shows it as the reference ID.

## 8. Data safety

- **Transactions**: multi-step writes run in one database transaction; on any failure everything
  rolls back. Work that cannot join the transaction (email, S3) runs after commit, or through an
  outbox table processed by a job.
- **Idempotency**: `POST` endpoints that create things accept `Idempotency-Key`. Store the key with
  the result for 24 hours; a repeat with the same key returns the stored result instead of creating
  a duplicate. A repeat with a different body returns 422.
- **Optimistic concurrency**: updatable records carry a `version` (or `updatedAt`). Updates send the
  version they read; a mismatch returns 409 `conflict`. Unique-constraint violations also map to 409.
- **Timeouts on dependencies**: every outbound call (database, email, third-party API) has a
  timeout. A timeout maps to 504 `unavailable`, a refused connection to 503.
- **Never swallow**: no empty `catch`. Either handle the error fully (and say how in a comment) or
  let it reach `toProblem`.

## 9. Background jobs

- Store `status` (`queued | running | succeeded | failed`), `attempts`, `lastError` (the kind and a
  safe reason, never a stack) and `nextRunAt`.
- Retry only retryable kinds, with backoff, up to a maximum (for example 5); then mark `failed`.
- Make every job step idempotent so a retry after a crash is safe.
- Surface `failed` where the user checks job status, and notify when the user must act.

## 10. Logging

```ts
logServerError({ kind, operation, status, requestId, error });
// → { level, kind, operation, status, requestId, timestamp, message, stack }
```

- Level by kind: `info` for expected user errors, `warn` for `unavailable` / `rateLimited`, `error`
  for `server`, `malformed`, `unexpected`.
- Include the stack only in server logs, never in responses.
- Never log passwords, tokens, cookies, `Authorization` headers, or personal data (email, name,
  phone, location). Log IDs instead.
- Log once, in `toProblem` (or the job runner), not at every layer.
