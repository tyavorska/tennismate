import { queryOptions } from '@tanstack/react-query';
import type { IsoDate } from '@/shared/lib';
import { calendarApi } from './calendarApi';

export const calendarQueries = {
  all: () => ({ queryKey: ['calendar'] as const }),
  range: (from: IsoDate, to: IsoDate) =>
    queryOptions({
      queryKey: ['calendar', 'range', from, to] as const,
      queryFn: () => calendarApi.range(from, to),
    }),
};
