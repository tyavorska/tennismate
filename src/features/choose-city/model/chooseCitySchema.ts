import { z } from 'zod';

export const chooseCitySchema = z.object({
  /** The id of the chosen city as the select gives it: text, empty until one is chosen. */
  cityId: z.string().min(1, 'Choose your city'),
});

export type ChooseCityInput = z.input<typeof chooseCitySchema>;

export const chooseCityDefaults = { cityId: '' } satisfies ChooseCityInput;
