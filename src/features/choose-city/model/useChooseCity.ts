import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { newProfileSchema, type Player } from '@/entities/player';
import { ApiError } from '@/shared/api';
import { chooseCity } from '../api/chooseCityApi';
import type { ChooseCityInput } from './chooseCitySchema';

export function useChooseCity(): UseMutationResult<Player, ApiError, ChooseCityInput> {
  const router = useRouter();
  return useMutation<Player, ApiError, ChooseCityInput>({
    mutationFn: ({ cityId }) => {
      const profile = newProfileSchema.safeParse({ cityId: Number(cityId) });
      if (!profile.success) {
        return Promise.reject(
          new ApiError({ kind: 'validation', fieldErrors: { cityId: 'Choose your city' } }),
        );
      }
      return chooseCity(profile.data);
    },
    onSuccess: () => {
      router.replace('/players');
      router.refresh();
    },
  });
}
