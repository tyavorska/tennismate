import { queryOptions } from '@tanstack/react-query';
import { savedPlayerApi } from './savedPlayerApi';

export const playerQueries = {
  all: () => ({ queryKey: ['players'] as const }),
  saved: () =>
    queryOptions({
      queryKey: ['players', 'saved'] as const,
      queryFn: () => savedPlayerApi.list(),
    }),
};
