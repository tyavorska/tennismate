'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ApiError } from '@/shared/api';
import { signOut } from '../api/signOutApi';

export function useSignOut(): UseMutationResult<undefined, ApiError, void> {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<undefined, ApiError>({
    mutationFn: signOut,
    onSuccess: () => {
      // Drop every cached query so the next user never sees this user's data.
      queryClient.clear();
      router.replace('/');
      router.refresh();
    },
  });
}
