'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ApiError } from '@/shared/api';
import { Button, FormAlert } from '@/shared/ui';
import { signOut } from '../api/signOutApi';

export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation<undefined, ApiError>({
    mutationFn: signOut,
    onSuccess: () => {
      // Drop every cached query so the next user never sees this user's data.
      queryClient.clear();
      router.replace('/');
      router.refresh();
    },
  });

  return (
    <>
      <Button variant="secondary" isPending={mutation.isPending} onPress={() => mutation.mutate()}>
        {mutation.isPending ? 'Signing out…' : 'Sign out'}
      </Button>
      {mutation.error !== null && <FormAlert>{mutation.error.message}</FormAlert>}
    </>
  );
}
