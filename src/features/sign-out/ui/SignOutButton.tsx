'use client';

import { Button, FormAlert } from '@/shared/ui';
import { useSignOut } from '../model/useSignOut';

export function SignOutButton() {
  const mutation = useSignOut();

  return (
    <>
      <Button variant="secondary" isPending={mutation.isPending} onPress={() => mutation.mutate()}>
        {mutation.isPending ? 'Signing out…' : 'Sign out'}
      </Button>
      {mutation.error !== null && <FormAlert>{mutation.error.message}</FormAlert>}
    </>
  );
}
