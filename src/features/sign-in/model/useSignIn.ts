import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { User } from '@/entities/user';
import type { ApiError } from '@/shared/api';
import { safeReturnTo } from '@/shared/lib';
import { signIn } from '../api/signInApi';
import type { SignInInput } from './signInSchema';

export function useSignIn(returnTo: string | null): UseMutationResult<User, ApiError, SignInInput> {
  const router = useRouter();
  return useMutation<User, ApiError, SignInInput>({
    mutationFn: signIn,
    onSuccess: () => {
      router.replace(safeReturnTo(returnTo));
      router.refresh();
    },
  });
}
