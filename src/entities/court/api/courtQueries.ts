import { queryOptions } from '@tanstack/react-query';
import { courtApi } from './courtApi';

export const courtQueries = {
  all: () => ({ queryKey: ['courts'] as const }),
  list: () =>
    queryOptions({
      queryKey: ['courts', 'list'] as const,
      queryFn: () => courtApi.list(),
    }),
};
