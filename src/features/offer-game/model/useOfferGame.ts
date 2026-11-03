import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { calendarQueries } from '@/entities/game';
import { openGameApi, openGameQueries, type NewGame, type OpenGame } from '@/entities/player';
import type { ApiError } from '@/shared/api';

export function useOfferGame(): UseMutationResult<OpenGame, ApiError, NewGame> {
  const queryClient = useQueryClient();

  return useMutation<OpenGame, ApiError, NewGame>({
    mutationFn: openGameApi.create,
    onSuccess: (game) => {
      queryClient.setQueryData(openGameQueries.list().queryKey, (current = []) => [
        game,
        ...current,
      ]);
      void queryClient.invalidateQueries(calendarQueries.all());
    },
  });
}

export function useRemoveGame(): UseMutationResult<undefined, ApiError, string> {
  const queryClient = useQueryClient();
  const { queryKey } = openGameQueries.list();

  return useMutation<undefined, ApiError, string>({
    mutationFn: openGameApi.remove,
    onSuccess: (_result, id) => {
      queryClient.setQueryData(queryKey, (current = []) =>
        current.filter((game) => game.id !== id),
      );
      void queryClient.invalidateQueries(calendarQueries.all());
    },
    // A game that is already gone is stale in the list, so fetch the real state.
    onError: () => queryClient.invalidateQueries({ queryKey }),
  });
}
