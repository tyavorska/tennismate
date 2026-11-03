import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

/** Never retries, so failures show up at once, and never refetches data a test put in the cache. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithQuery(
  ui: ReactElement,
  client: QueryClient = createTestQueryClient(),
): RenderResult {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
