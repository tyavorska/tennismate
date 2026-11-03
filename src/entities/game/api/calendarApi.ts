import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import type { IsoDate } from '@/shared/lib';
import { calendarEventSchema, type CalendarEvent } from '../model/calendarEvent';

export const calendarApi = {
  range: (from: IsoDate, to: IsoDate): Promise<readonly CalendarEvent[]> =>
    apiFetch(`/api/calendar?from=${from}&to=${to}`, { schema: z.array(calendarEventSchema) }),
};
