import { z } from 'zod';

export const districtNameSchema = z.string().min(1);

export const courtSchema = z.object({
  name: z.string().min(1),
  district: districtNameSchema,
});
export type Court = Readonly<z.infer<typeof courtSchema>>;
