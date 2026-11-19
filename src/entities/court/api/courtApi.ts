import { z } from 'zod';
import { apiFetch } from '@/shared/api';
import { courtSchema, type Court } from '../model/court';
import { apiRoutes } from '@/shared/config';

export const courtApi = {
  list: (): Promise<readonly Court[]> =>
    apiFetch(apiRoutes.courts, { schema: z.array(courtSchema) }),
};
