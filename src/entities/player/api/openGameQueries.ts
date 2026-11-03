import { queryOptions } from '@tanstack/react-query';
import { openGameApi } from './openGameApi';

export const openGameQueries = {
  all: () => ({ queryKey: ['games'] as const }),
  list: () =>
    queryOptions({
      queryKey: ['games', 'list'] as const,
      queryFn: () => openGameApi.list(),
    }),
};
