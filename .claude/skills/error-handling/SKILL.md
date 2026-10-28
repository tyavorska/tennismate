---
name: error-handling
description: Error-handling rules for TennisMate, frontend and backend. Use whenever code calls an API, saves or submits data, loads or refreshes data, exports a file, checks permissions, handles a session, runs a background job, writes a Route Handler or Server Action, or when the user asks to add error handling, review failure paths, pick an error message, or asks "what if this fails?". Says which error category applies, whether to retry, which component shows it, which handler catches it, what the server returns, and which tests to write.
---

# Error handling

Every failure must leave the user knowing three things: **what happened**, **whether their data is
safe**, and **what to do next**. This skill is the single source for how TennisMate does that.

Read the reference that matches the work:

| Work                                                        | Read                     |
| ----------------------------------------------------------- | ------------------------ |
| Client code: queries, mutations, forms, pages, error states | `references/frontend.md` |
| Route Handlers, Server Actions, `server/`, jobs             | `references/backend.md`  |
| Writing or reviewing tests                                  | `references/testing.md`  |

## 1. Principles

1. Every async operation has a failure branch. No call fails silently.
2. Keep the last valid state. Never replace good data with an empty or broken result.
3. Retry only what is safe to repeat. Never retry what will fail again without a change.
4. Log every error with enough context to debug it. Show the user only a plain-language message.
5. Test the failure branch, not only the success branch.

## 2. Categories

One error model is shared by server and client: the `ErrorKind` union in
`shared/api/errors.ts` (see `references/frontend.md`). Every failure is classified into exactly one
kind, and everything else (retry, message, component) is looked up from the kind.

| Kind              | Comes from                       | Retry                    | Keep data              | Message                                                    | Next action                          | Shown in                         |
| ----------------- | -------------------------------- | ------------------------ | ---------------------- | ---------------------------------------------------------- | ------------------------------------ | -------------------------------- |
| `network`         | No connection, request timed out | Yes, 3 attempts, backoff | Yes                    | We couldn't reach the server. Your changes are still here. | Retry button                         | Context (see 3)                  |
| `unavailable`     | 502, 503, 504                    | Yes, 3 attempts, backoff | Yes                    | The service is temporarily unavailable.                    | Retry later                          | Context                          |
| `server`          | 500                              | No                       | Yes                    | Something went wrong on our side. Please try again.        | Retry; contact support if it repeats | Context, with reference ID       |
| `validation`      | 400, 422                         | No                       | Yes, keep input        | Some fields need attention. (+ per-field text)             | Fix the fields                       | `FieldError` + `FormAlert`       |
| `unauthenticated` | 401                              | No                       | Keep input if possible | Your session has expired. Sign in again to continue.       | Sign in, return to the same place    | Redirect to `/sign-in?returnTo=` |
| `forbidden`       | 403                              | No                       | Yes                    | You don't have permission to do this.                      | Request access or contact an admin   | `AccessDenied` state             |
| `notFound`        | 404                              | No                       | Keep last valid view   | This item no longer exists.                                | Go back to the list                  | `not-found.tsx` / `ErrorState`   |
| `conflict`        | 409                              | No, fetch latest first   | Yes, keep input        | This item was changed by someone else.                     | Reload, then review changes          | `ConflictDialog`                 |
| `rateLimited`     | 429                              | Yes, after `Retry-After` | Yes                    | Too many requests. Trying again shortly.                   | Automatic retry, or wait             | `Toast` (status)                 |
| `malformed`       | Response fails the Zod schema    | No                       | Keep last valid data   | We received unexpected data.                               | Retry, or contact support            | Context, with reference ID       |
| `unexpected`      | Thrown exception, code bug       | No                       | Yes                    | Something went wrong.                                      | Retry, plus reference ID for support | `error.tsx` boundary             |

"Context" means the surface depends on the operation; section 3 decides it.

## 3. Which component shows it

Pick by **operation** and **whether data is already on screen**, then by kind:

| Situation                           | Component                                  | Behaviour                                                                                      |
| ----------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Field rejected (`validation`)       | `FieldError` under the field               | Text next to the field, linked with `aria-describedby`, focus moves to the first invalid field |
| Submit failed, any other kind       | `FormAlert` above the submit button        | `role="alert"`, says whether the change was saved, keeps all input, has a Retry action         |
| Load failed, **no data yet**        | `ErrorState` in place of the content       | Heading, message, Retry button. Never a blank area                                             |
| Refresh failed, **data on screen**  | `Banner` above the content                 | `role="status"`, non-blocking, keeps old data, Retry action                                    |
| Background or one-off action failed | `Toast`                                    | `role="status"` (or `alert` when action is needed), Retry action, does not auto-dismiss errors |
| `forbidden`                         | `AccessDenied` state                       | Replaces the content area, explains, offers "Request access"                                   |
| `notFound` on a page                | `not-found.tsx` (via `notFound()`)         | Link back to the list                                                                          |
| `conflict`                          | `ConflictDialog`                           | Shows that someone else changed it, "Reload and review", keeps the user's draft                |
| `unauthenticated`                   | No component: redirect                     | Save draft, go to `/sign-in?returnTo=<current path>`, return after sign-in                     |
| Render crash / `unexpected`         | `error.tsx` (segment) / `global-error.tsx` | Message, reference ID (`error.digest`), `retry()` button                                       |
| Export failed                       | `Toast`                                    | Screen unchanged, no file downloaded, Retry action                                             |

All of these live in `shared/ui` and are built on `react-aria-components`. Messages always come
from the `errorPolicy` table, never written inline.

## 4. Which handler catches it

| Layer                         | Handler                                                     | Job                                                                     |
| ----------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| HTTP client                   | `apiFetch` in `shared/api/apiFetch.ts`                      | Timeout, classify status → `ApiError`, Zod-parse the body (`malformed`) |
| Queries                       | `QueryClient` default `retry` / `retryDelay`                | Retry only retryable kinds, max 3, backoff or `Retry-After`             |
| All queries and mutations     | `QueryCache` / `MutationCache` `onError` in `app/providers` | Log once; `unauthenticated` → redirect with `returnTo`                  |
| One mutation                  | `useMutation` `onError`                                     | `validation` → `setError` per field; other kinds → `FormAlert` state    |
| Render errors                 | `error.tsx` per route segment, `global-error.tsx` at root   | Catch crashes, show reference ID, `retry()`                             |
| Missing items in Server Comp. | `notFound()` → `not-found.tsx`                              | 404 page with a way back                                                |
| Server input                  | Zod in Route Handler / Server Action                        | Reject with `validation` and field errors, before any work              |
| Server domain errors          | `toProblem()` in `server/http/problem.ts`                   | Map every error to one response shape; log; hide internals              |

## 5. Retry rules

- Retry only `network`, `unavailable` (502, 503, 504) and `rateLimited`.
- At most 3 attempts, delays of 1s, 2s, 4s. For `rateLimited`, wait for `Retry-After` instead.
- Retry only idempotent operations (GET, PUT, DELETE) or writes protected by an `Idempotency-Key`.
- Never retry 400, 401, 403, 404, 409 or 422 automatically.
- After the last attempt, stop and show the error with a manual Retry action.

## 6. Operation rules

**Save / submit**: disable the submit button and show a pending state; ignore repeat submits while
one is in flight. On failure keep every input on screen, never reset the form. Say clearly whether
the change was saved, not saved, or may be partly saved. Multi-step saves roll back completed steps
or leave the last valid state. Send an `Idempotency-Key` (a client-generated UUID per attempt
group) so a retry cannot create a duplicate.

**Export / download**: build the complete file first, then start the download. On failure do
nothing visible except the error: no partial or empty file, screen unchanged.

**Load / refresh**: show a loading state. Swap the view only after new data arrives and parses.
Failure with data on screen → keep it, show a `Banner`. Failure without data → `ErrorState`.

**Permission checks**: hide or disable actions the user cannot perform, and still handle a 403 when
the UI check was out of date.

**Session expiry**: stop the operation, keep unsaved input (draft in `sessionStorage`), send the
user to sign in, return them to the same place.

**Background jobs**: record a failure status with a reason where the user looks for job status,
notify when action is needed, cap retries and then mark the job failed.

**Double-click / rapid repeats**: disable the control during the request and drop duplicates.

## 7. Message rules

- Say what happened, in plain words. Say what state the user's data is in. Say what to do next.
- Never blame the user. Never show raw codes, stack traces or internal names.
- When support may be needed, show a short reference ID (the request ID or `error.digest`).
- Same kind, same message, everywhere: messages live only in `errorPolicy`.

## 8. Logging rules

- Log the kind, operation name, status code, timestamp and request ID.
- Never log passwords, tokens, cookies or personal data (emails, names, phone numbers).
- `info` for expected user errors (`validation`, `unauthenticated`, `forbidden`, `notFound`,
  `conflict`); `error` for `server`, `malformed` and `unexpected`; `warn` for `network`,
  `unavailable`, `rateLimited` once retries are exhausted.
- Log once, at the boundary that handles the error, not at every layer it passes through.

## 9. Decision order when an error happens

1. Stop the current operation.
2. Log the error with context.
3. Retryable and attempts left? Retry.
4. Check the data: roll back partial writes or keep the last valid state.
5. Show the message for the kind (section 2) in the component for the situation (section 3).
6. Show the next action.
7. Keep the screen usable. Never blank, never frozen.

## 10. Review checklist

- [ ] Every `fetch`, query, mutation and Server Action has a failure branch.
- [ ] Each failure is classified into one `ErrorKind`; no ad-hoc status checks in components.
- [ ] Messages come from `errorPolicy`; none hard-coded in JSX.
- [ ] Submit is disabled while pending; failed submit keeps input.
- [ ] Refresh failure keeps old data; first-load failure shows `ErrorState`, never blank.
- [ ] Retries only for retryable kinds, max 3, with backoff; writes carry an `Idempotency-Key`.
- [ ] 401 redirects with `returnTo`; 403 shows `AccessDenied`; 409 opens `ConflictDialog`.
- [ ] The route segment has `error.tsx`; missing items call `notFound()`.
- [ ] Server validates with Zod and answers with the problem shape; no stack traces leak.
- [ ] Logs carry kind, operation, status and request ID, and no secrets or personal data.
- [ ] Tests cover the list in `references/testing.md`.
