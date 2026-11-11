import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import { courtSchema, type Court } from '../model/court';

export const courtApi = {
  list: (): Promise<readonly Court[]> => apiFetch('/api/courts', { schema: z.array(courtSchema) }),
};
