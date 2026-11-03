import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { openGameApi, openGameQueries, type OpenGame } from '@/entities/player';
import { calendarQueries } from '@/entities/game';
import type { ApiError } from '@/shared/api';

type Participation = Readonly<{ id: string; joined: boolean }>;

/** Joins or leaves a game, then puts the game the server returns into the list. */
export function useToggleJoin(): UseMutationResult<OpenGame, ApiError, Participation> {
  const queryClient = useQueryClient();
  const { queryKey } = openGameQueries.list();

  return useMutation<OpenGame, ApiError, Participation>({
    mutationFn: ({ id, joined }) => (joined ? openGameApi.join(id) : openGameApi.leave(id)),
    onSuccess: (game) => {
      queryClient.setQueryData(queryKey, (current = []) =>
        current.map((candidate) => (candidate.id === game.id ? game : candidate)),
      );
      void queryClient.invalidateQueries(calendarQueries.all());
    },
    // A full or removed game is stale in the list, so fetch the real state.
    onError: () => queryClient.invalidateQueries({ queryKey }),
  });
}
