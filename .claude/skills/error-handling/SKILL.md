---
name: error-handling
description: Check the failure paths of a change in Let. Use when the user asks "what if this fails?", asks to review or audit error handling, or wants a save, load, API call, Route Handler, Server Action or socket event checked for failures. Walks the change point by point, runs a checklist and a test matrix, and reports what is missing. The rules themselves are in `.claude/rules/backend.md` and `frontend.md` ("Errors"); this skill does not repeat them.
---

# Error-handling review

The rules are in the "Errors" sections of `.claude/rules/backend.md` and `.claude/rules/frontend.md`.
Read them first. This is the procedure for checking a change against them.

Every failure must leave the user knowing **what happened**, **whether their data is safe**, and
**what to do next**.

## 1. Find the failure points

List every place the change can fail: each `fetch`, query, mutation, socket request, Route Handler
and Server Action. A change with no failure point needs no review.

## 2. Ask five questions at each point

| Question                                 | A good answer                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Which `ErrorKind` is it?                 | Exactly one, from `shared/api/errors.ts`                                                  |
| Is it safe to retry?                     | Only `network`, `unavailable`, `rateLimited`, and only for a write that is safe to repeat |
| What does the user see?                  | The `errorPolicy` message in `ErrorState`, `Banner` or `FormAlert`                        |
| What happens to their data and input?    | Kept. Nothing replaced by an empty or broken result                                       |
| What is logged, and can support find it? | One line with kind, operation, status, request id; the reference shown                    |

## 3. Checklist

- [ ] Every failure point has a failure branch.
- [ ] A failed first load shows `ErrorState`, not an empty list. `data` is not defaulted to `[]`
      before the error is checked.
- [ ] A failed refresh keeps the data on screen and shows a `Banner`.
- [ ] A failed submit or send keeps every input, and the control is disabled while pending.
- [ ] A repeat after a failure reuses the same client id.
- [ ] Messages come from `errorPolicy`, none in JSX or in a test fixture.
- [ ] Retries only for retryable kinds, never for a 4xx.
- [ ] A refused session sends the player to `/sign-in?returnTo=`.
- [ ] The server validates before any work and answers with a `Problem`. No stack, SQL or library
      message in a body.
- [ ] Another city or another player's row answers `notFound`.
- [ ] Nothing logs a password, token, cookie or email. No empty `catch`.

## 4. Test matrix

Check that the tests cover the failure branch, not only success.

| Case                                  | Applies to       | Assert                                                   |
| ------------------------------------- | ---------------- | -------------------------------------------------------- |
| Each relevant failure kind            | all              | The `errorPolicy` message is shown (`alert` or `status`) |
| A failed save or send keeps the input | save, send       | The typed text is still there                            |
| First load fails                      | load             | An error and Try again, never an empty list              |
| A refresh fails                       | refresh          | The old data stays and a notice shows                    |
| Retry works on the second try         | retryable writes | One failure, then success, same client id                |
| Retry gives up                        | retryable writes | Exactly 3 attempts, then the error and an enabled button |
| No retry for a 4xx                    | all              | Exactly 1 attempt                                        |
| Pressing twice sends once             | save, send       | One request, the button disabled while pending           |
| Server error                          | server           | The generic message and a `requestId`, nothing internal  |
| A stranger, another city, a bad body  | server           | `notFound`, `notFound`, `validation` with `fieldErrors`  |

UI tests use `createTestQueryClient`, `renderWithQuery`, and for the socket `createTestSocket` and
`TestRealtime`. Register retry rules with a zero delay.

## 5. Report

Give each finding as **Problem**, **Where** (file and line) and **Fix**. Run the tests and quote
the real result.

Do not report these as new defects. They are known gaps, listed in the rules: no `Toast`,
`AccessDenied`, `ConflictDialog`, `LoadingState`, `error.tsx` or `not-found.tsx`; no global handler
for an expired session on REST calls; no request id set in `src/proxy.ts`; no `Idempotency-Key`
storage or `version` on rows. Say if the change would have needed one of them.
