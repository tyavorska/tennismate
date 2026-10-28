# Testing failure paths

Vitest + Testing Library + MSW, tests next to the code. Follow `CLAUDE.md`: group with `describe`
by behavior, name tests as plain sentences, query by role, label or text. Shared MSW helpers live in
`shared/testing/`.

## Required cases for every operation

| Case                                          | Applies to                    | What to assert                                                         |
| --------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| Success                                       | all                           | The result is shown                                                    |
| Each relevant failure kind                    | all                           | The `errorPolicy` message is visible (`getByRole('alert')` / `status`) |
| Retry succeeds on the second attempt          | retryable reads, keyed writes | One error, then data shown; request count is 2                         |
| Retry gives up after the limit                | retryable                     | Exactly 3 requests, then the message and a Retry button                |
| No automatic retry for 4xx                    | all                           | Exactly 1 request for 400 / 401 / 403 / 404 / 409 / 422                |
| Double-click sends one request                | save / submit                 | Two quick clicks → request count is 1; button disabled while pending   |
| Failed save keeps user input                  | save / submit                 | Inputs still hold the typed values after the error                     |
| Validation errors land on fields              | save / submit                 | `getByLabelText('Email')` has the field message; focus moved there     |
| Failed refresh keeps old data                 | load / refresh                | Old items still visible plus the banner                                |
| First-load failure shows an error state       | load                          | Heading and Retry visible; never an empty region                       |
| Expired session redirects to sign-in          | any authenticated call        | Router called with `/sign-in?returnTo=...`; draft saved                |
| Permission denied shows the access state      | protected actions             | "You don't have permission to do this." and no broken UI               |
| Conflict opens the dialog and keeps the draft | updates                       | Dialog visible; the user's edits still present                         |
| Malformed response keeps old data             | load / refresh                | Old data visible; "We received unexpected data."                       |
| Export failure downloads nothing              | export                        | No object URL created; screen unchanged; toast visible                 |

## Server-side cases

- Invalid body → 422 with `fieldErrors`; valid body → 2xx.
- No session → 401; wrong user → 403 (or 404 when existence must not leak).
- Thrown internal error → 500 with the generic title, a `requestId`, and **no** stack or message
  from the original error in the body.
- Same `Idempotency-Key` twice → one record created, same response returned.
- Stale `version` → 409.
- Logs contain kind, operation, status and request ID, and no password, token or email.

## Example

```tsx
describe('CreateMatchForm', () => {
  describe('when the server is down', () => {
    it('keeps the typed values and offers a retry', async () => {
      server.use(
        http.post('/api/matches', () => HttpResponse.json(problem('server'), { status: 500 })),
      );
      const user = userEvent.setup();
      renderWithProviders(<CreateMatchForm />);

      await user.type(screen.getByLabelText('Court'), 'Central Park');
      await user.click(screen.getByRole('button', { name: 'Save match' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Something went wrong on our side. Please try again.',
      );
      expect(screen.getByLabelText('Court')).toHaveValue('Central Park');
      expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
    });
  });

  describe('when the user double-clicks save', () => {
    it('sends only one request', async () => {
      const requests = countRequests('/api/matches');
      // ...two quick clicks...
      expect(requests.count).toBe(1);
    });
  });
});
```
