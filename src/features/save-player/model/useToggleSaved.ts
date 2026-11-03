import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { playerQueries, savedPlayerApi } from '@/entities/player';
import type { ApiError } from '@/shared/api';

type SavedChange = Readonly<{ id: string; saved: boolean }>;
type Rollback = Readonly<{ previous: readonly string[] | undefined }>;

/** Saves or removes a player. The bookmark flips at once and goes back if the server says no. */
export function useToggleSaved(): UseMutationResult<undefined, ApiError, SavedChange, Rollback> {
  const queryClient = useQueryClient();
  const { queryKey } = playerQueries.saved();

  return useMutation<undefined, ApiError, SavedChange, Rollback>({
    mutationFn: ({ id, saved }) => (saved ? savedPlayerApi.save(id) : savedPlayerApi.remove(id)),
    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (current = []) =>
        saved
          ? [...current.filter((savedId) => savedId !== id), id]
          : current.filter((savedId) => savedId !== id),
      );
      return { previous };
    },
    onError: (_error, _change, rollback) => {
      queryClient.setQueryData(queryKey, rollback?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
