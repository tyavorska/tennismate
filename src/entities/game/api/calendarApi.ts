import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import type { IsoDate } from '@/shared/lib';
import { calendarEventSchema, type CalendarEvent } from '../model/calendarEvent';
import { apiRoutes } from '@/shared/config';

export const calendarApi = {
  range: (from: IsoDate, to: IsoDate): Promise<readonly CalendarEvent[]> =>
    apiFetch(`${apiRoutes.calendar}?from=${from}&to=${to}`, {
      schema: z.array(calendarEventSchema),
    }),
};
