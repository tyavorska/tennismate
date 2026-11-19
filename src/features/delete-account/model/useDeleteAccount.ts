'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ApiError } from '@/shared/api';
import { routes } from '@/shared/config';
import { deleteAccount } from '../api/deleteAccountApi';
import type { DeleteAccountInput } from './deleteAccountSchema';

export function useDeleteAccount(): UseMutationResult<undefined, ApiError, DeleteAccountInput> {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<undefined, ApiError, DeleteAccountInput>({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // The account is gone, so nothing cached may stay for the next visitor.
      queryClient.clear();
      router.replace(routes.landing);
      router.refresh();
    },
  });
}
