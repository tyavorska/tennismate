import { z } from 'zod';

const searchParamsSchema = z.object({
  returnTo: z.string().optional().catch(undefined),
});

export function returnToParam(
  searchParams: Readonly<Record<string, string | string[] | undefined>>,
): string | undefined {
  return searchParamsSchema.parse(searchParams).returnTo;
}
