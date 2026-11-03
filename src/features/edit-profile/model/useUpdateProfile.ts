import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Player, ProfileUpdate } from '@/entities/player';
import type { ApiError } from '@/shared/api';
import { updateProfile } from '../api/profileApi';

export function useUpdateProfile(): UseMutationResult<Player, ApiError, ProfileUpdate> {
  const router = useRouter();

  return useMutation<Player, ApiError, ProfileUpdate>({
    mutationFn: updateProfile,
    // The header and the other pages read the profile on the server, so ask them to load it again.
    onSuccess: () => router.refresh(),
  });
}
