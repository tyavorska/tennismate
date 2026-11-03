import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { signUpRequestSchema, type User } from '@/entities/user';
import { ApiError } from '@/shared/api';
import { signUp } from '../api/signUpApi';
import type { SignUpInput } from './signUpSchema';

export function useSignUp(): UseMutationResult<User, ApiError, SignUpInput> {
  const router = useRouter();
  return useMutation<User, ApiError, SignUpInput>({
    mutationFn: ({ email, password, cityId }) => {
      const request = signUpRequestSchema.safeParse({ email, password, cityId: Number(cityId) });
      if (!request.success) {
        return Promise.reject(
          new ApiError({ kind: 'validation', fieldErrors: { cityId: 'Choose your city' } }),
        );
      }
      return signUp(request.data);
    },
    onSuccess: () => {
      router.replace('/players');
      router.refresh();
    },
  });
}
