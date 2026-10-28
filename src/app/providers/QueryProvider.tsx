'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { errorPolicy, toApiError } from '@/shared/api';

const maxAttempts = 3;

function shouldRetry(failureCount: number, error: Error): boolean {
  return failureCount < maxAttempts && errorPolicy[toApiError(error).kind].retryable;
}

function retryDelay(attempt: number, error: Error): number {
  const retryAfterSeconds = toApiError(error).retryAfterSeconds;
  return retryAfterSeconds === undefined ? 1000 * 2 ** attempt : retryAfterSeconds * 1000;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, retryDelay },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
