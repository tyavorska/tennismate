---
paths:
  - 'src/**/*.test.ts'
  - 'src/**/*.test.tsx'
  - 'src/shared/testing/**'
---

# Testing

- Vitest with Testing Library. Tests sit next to the code they cover (`date.ts` → `date.test.ts`).
- Shared test infrastructure (render helpers, MSW handlers, setup) lives in `shared/testing/` and
  is imported from there, not from deep paths.
- Test behavior through a slice's public API, not its implementation details.
- Group tests with `describe` blocks by section or behavior. Name each test as a plain-English
  sentence that says what it checks: `it('shows an error when the passwords do not match')`.
- Query the UI the way a user would: by role and accessible name, label, or visible text
  (`getByRole`, `getByLabelText`, `getByText`). Use `data-testid` only when nothing else works.
  Querying by role and name doubles as an accessibility check.
- Client tests use `createTestQueryClient` and `renderWithQuery` from `@/shared/testing`, put data
  in the cache with `setQueryData`, and stub `fetch` with a small in-memory fake of the API.
- Server tests follow the "Tests for backend code" section of `.claude/rules/backend.md`.
- Test the failure branch of every request, not only success: the error message, the input kept, a
  failed first load, a failed refresh, and that pressing twice sends once.
