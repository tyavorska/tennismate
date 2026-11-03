import { z } from 'zod';

export const citySchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  /** ISO 3166-1 alpha-2, such as `PL`. */
  country: z.string().length(2),
});
export type City = Readonly<z.infer<typeof citySchema>>;
