import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { User } from '@/entities/user';
import type { ApiError } from '@/shared/api';
import { signUp } from '../api/signUpApi';
import type { SignUpInput } from './signUpSchema';

export function useSignUp(): UseMutationResult<User, ApiError, SignUpInput> {
  const router = useRouter();
  return useMutation<User, ApiError, SignUpInput>({
    mutationFn: ({ email, password }) => signUp({ email, password }),
    onSuccess: () => {
      router.replace('/home');
      router.refresh();
    },
  });
}
