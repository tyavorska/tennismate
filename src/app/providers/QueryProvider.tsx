'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { registerConversationMutations } from '@/entities/conversation';
import { retryDelay, shouldRetry } from '@/shared/api';

// Lets data handed over from the server render count as fresh instead of refetching at once.
const staleTimeMs = 30_000;

function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, retryDelay, staleTime: staleTimeMs },
      mutations: { retry: false },
    },
  });
  registerConversationMutations(queryClient);
  return queryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
